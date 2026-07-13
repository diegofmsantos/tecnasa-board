"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { extractTextFromFile } from "@/lib/extract-text"
import { requireInternalUser, toActionError } from "@/lib/auth"
import { createTranscriptSchema, formatZodError } from "@/lib/validations"

interface Message {
    role: "user" | "assistant"
    content: string
}

const MAX_TRANSCRIPT_FILE_SIZE = 15 * 1024 * 1024 // 15MB
const ALLOWED_TRANSCRIPT_EXTENSIONS = [".txt", ".pdf", ".docx"]

// ─── TRANSCRIÇÕES ─────────────────────────────────────────────────────────────

export async function createTranscript(formData: FormData): Promise<{ error: string } | { success: true }> {
    try {
        const user = await requireInternalUser()
        const parsed = createTranscriptSchema.safeParse({
            title: formData.get("title"),
            companyId: formData.get("companyId"),
            sectorId: formData.get("sectorId"),
            content: formData.get("content"),
        })
        if (!parsed.success) return { error: formatZodError(parsed.error) }
        const { title, companyId, sectorId } = parsed.data
        let content = parsed.data.content ?? ""

        const file = formData.get("file") as File | null

        // Se um arquivo foi enviado, extrai o texto dele
        if (file && file.size > 0) {
            const name = file.name.toLowerCase()
            if (!ALLOWED_TRANSCRIPT_EXTENSIONS.some((ext) => name.endsWith(ext))) {
                return { error: "Formato não suportado. Use arquivos .txt, .pdf ou .docx" }
            }
            if (file.size > MAX_TRANSCRIPT_FILE_SIZE) {
                return { error: "Arquivo muito grande. O limite é 15MB." }
            }

            try {
                content = await extractTextFromFile(file)
            } catch (err) {
                return { error: err instanceof Error ? err.message : "Erro ao processar o arquivo." }
            }
        }

        if (!content?.trim()) {
            return { error: "Adicione o texto ou faça upload de um arquivo." }
        }

        await prisma.transcript.create({
            data: {
                title,
                content,
                companyId,
                sectorId: sectorId || null,
                userId: user.id,
            },
        })

        revalidatePath(`/company/${companyId}`)
        return { success: true }
    } catch (err) {
        return toActionError(err, "Erro ao salvar transcrição.")
    }
}

export async function getTranscripts(companyId: string) {
    await requireInternalUser()
    return prisma.transcript.findMany({
        where: { companyId },
        orderBy: { createdAt: "desc" },
        include: {
            sector: { select: { id: true, name: true } },
            user: { select: { name: true } },
        },
    })
}

export async function deleteTranscript(transcriptId: string, companyId: string) {
    try {
        await requireInternalUser()
        await prisma.transcript.delete({ where: { id: transcriptId } })
        revalidatePath(`/company/${companyId}`)
        return { success: true }
    } catch (err) {
        return toActionError(err, "Erro ao remover transcrição.")
    }
}

// ─── SESSÕES DE DIAGNÓSTICO ───────────────────────────────────────────────────

export async function createDiagnosticSession(
    companyId: string,
    title: string,
    transcriptIds: string[]
) {
    try {
        const user = await requireInternalUser()
        if (!title?.trim()) return { error: "Título é obrigatório." }

        const session = await prisma.diagnosticSession.create({
            data: {
                title: title.trim(),
                companyId,
                messages: [],
                userId: user.id,
                transcripts: { connect: transcriptIds.map((id) => ({ id })) },
            },
            include: { transcripts: true },
        })

        revalidatePath(`/company/${companyId}`)
        return { success: true, session }
    } catch (err) {
        return toActionError(err, "Erro ao criar sessão de diagnóstico.")
    }
}

export async function getDiagnosticSession(sessionId: string) {
    await requireInternalUser()
    return prisma.diagnosticSession.findUnique({
        where: { id: sessionId },
        include: {
            transcripts: true,
            company: {
                include: {
                    sectors: {
                        include: { processes: true },
                    },
                },
            },
        },
    })
}

export async function deleteDiagnosticSession(sessionId: string, companyId: string) {
    try {
        await requireInternalUser()
        await prisma.diagnosticSession.delete({ where: { id: sessionId } })
        revalidatePath(`/company/${companyId}`)
        return { success: true }
    } catch (err) {
        return toActionError(err, "Erro ao remover sessão de diagnóstico.")
    }
}

// ─── ENVIAR MENSAGEM PARA A IA ────────────────────────────────────────────────

export async function sendMessageToAI(
    sessionId: string,
    companyId: string,
    userMessage: string
) {
    try {
        await requireInternalUser()

        const apiKey = process.env.ANTHROPIC_API_KEY
        if (!apiKey) {
            return {
                error: "O módulo de IA ainda não está ativado. Entre em contato com o administrador.",
            }
        }

        const session = await prisma.diagnosticSession.findUnique({
            where: { id: sessionId },
            include: {
                transcripts: true,
                company: {
                    include: {
                        sectors: { include: { processes: true } },
                    },
                },
            },
        })

        if (!session) return { error: "Sessão não encontrada." }

        // Converte o Json do Prisma para Message[] com segurança
        const rawMessages: unknown = session.messages
        const messages: Message[] = Array.isArray(rawMessages)
            ? rawMessages.filter(
                (m): m is Message =>
                    !!m && typeof m === "object" && "role" in m && "content" in m &&
                    typeof (m as Record<string, unknown>).role === "string" &&
                    typeof (m as Record<string, unknown>).content === "string"
            )
            : []

        const sectorsContext = session.company.sectors
            .map((s) => `- ${s.name}: ${s.processes.map((p) => p.title).join(", ")}`)
            .join("\n")

        const transcriptsContext = session.transcripts
            .map((t, i) => `### Transcrição ${i + 1}: ${t.title}\n${t.content}`)
            .join("\n\n---\n\n")

        const systemPrompt = `Você é um consultor sênior de gestão e processos da Tecnasa Consultoria.

## Contexto do Cliente
**Empresa:** ${session.company.name}
**Segmento:** ${session.company.segment ?? "Não informado"}

## Estrutura Mapeada
${sectorsContext || "Nenhum setor mapeado ainda."}

## Transcrições de Reuniões
${transcriptsContext}

---

## Suas responsabilidades:
- Identificar gargalos, ineficiências e problemas operacionais mencionados nas reuniões
- Comparar com benchmarks e boas práticas do segmento ${session.company.segment ?? "empresarial"}
- Sugerir soluções práticas e implementáveis
- Priorizar os problemas por impacto e facilidade de resolução
- Ser objetivo, direto e usar linguagem executiva
- Responder sempre em português brasileiro
- Quando identificar problemas, estruture: **Problema → Impacto → Solução sugerida**`

        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": apiKey,
                "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
                model: "claude-sonnet-4-6",
                max_tokens: 2048,
                system: systemPrompt,
                messages: [
                    ...messages.map((m) => ({ role: m.role, content: m.content })),
                    { role: "user", content: userMessage },
                ],
            }),
        })

        if (!response.ok) {
            const err = await response.json()
            return { error: `Erro na API: ${err?.error?.message ?? "Tente novamente."}` }
        }

        const data = await response.json()
        const assistantMessage = data.content?.[0]?.text ?? "Sem resposta."

        // Salva as mensagens como array de objetos simples (compatível com Prisma Json)
        const updatedMessages = [
            ...messages,
            { role: "user", content: userMessage },
            { role: "assistant", content: assistantMessage },
        ]

        await prisma.diagnosticSession.update({
            where: { id: sessionId },
            data: { messages: updatedMessages },
        })

        revalidatePath(`/company/${companyId}`)
        return { success: true, message: assistantMessage }
    } catch (err) {
        return toActionError(err, "Erro ao conectar com a IA.")
    }
}
