"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@clerk/nextjs/server"
import { extractTextFromFile } from "@/lib/extract-text"

interface Message {
    role: "user" | "assistant"
    content: string
}

// ─── TRANSCRIÇÕES ─────────────────────────────────────────────────────────────

export async function createTranscript(formData: FormData) {
    const title = formData.get("title") as string
    const companyId = formData.get("companyId") as string
    const sectorId = formData.get("sectorId") as string
    const file = formData.get("file") as File | null
    let content = formData.get("content") as string

    if (!title || !companyId) {
        return { error: "Título é obrigatório." }
    }

    // Se um arquivo foi enviado, extrai o texto dele
    if (file && file.size > 0) {
        try {
            content = await extractTextFromFile(file)
        } catch (err: any) {
            return { error: err.message ?? "Erro ao processar o arquivo." }
        }
    }

    if (!content?.trim()) {
        return { error: "Adicione o texto ou faça upload de um arquivo." }
    }

    const { userId: clerkId } = await auth()
    const user = clerkId
        ? await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
        : null

    await prisma.transcript.create({
        data: {
            title,
            content,
            companyId,
            sectorId: sectorId || null,
            userId: user?.id ?? null,
        },
    })

    revalidatePath(`/company/${companyId}`)
    return { success: true }
}

export async function getTranscripts(companyId: string) {
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
    await prisma.transcript.delete({ where: { id: transcriptId } })
    revalidatePath(`/company/${companyId}`)
    return { success: true }
}

// ─── SESSÕES DE DIAGNÓSTICO ───────────────────────────────────────────────────

export async function createDiagnosticSession(
    companyId: string,
    title: string,
    transcriptIds: string[]
) {
    const { userId: clerkId } = await auth()
    const user = clerkId
        ? await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
        : null

    const session = await prisma.diagnosticSession.create({
        data: {
            title,
            companyId,
            messages: [],
            userId: user?.id ?? null,
            transcripts: { connect: transcriptIds.map((id) => ({ id })) },
        },
        include: { transcripts: true },
    })

    revalidatePath(`/company/${companyId}`)
    return session
}

export async function getDiagnosticSessions(companyId: string) {
    return prisma.diagnosticSession.findMany({
        where: { companyId },
        orderBy: { updatedAt: "desc" },
        include: {
            transcripts: { select: { id: true, title: true } },
            user: { select: { name: true } },
        },
    })
}

export async function getDiagnosticSession(sessionId: string) {
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
    await prisma.diagnosticSession.delete({ where: { id: sessionId } })
    revalidatePath(`/company/${companyId}`)
    return { success: true }
}

// ─── ENVIAR MENSAGEM PARA A IA ────────────────────────────────────────────────

export async function sendMessageToAI(
    sessionId: string,
    companyId: string,
    userMessage: string
) {
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
    const rawMessages = session.messages
    const messages: Message[] = Array.isArray(rawMessages)
        ? (rawMessages as any[]).filter(
            (m) => m && typeof m.role === "string" && typeof m.content === "string"
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
**Segmento:** ${(session.company as any).segment ?? "Não informado"}

## Estrutura Mapeada
${sectorsContext || "Nenhum setor mapeado ainda."}

## Transcrições de Reuniões
${transcriptsContext}

---

## Suas responsabilidades:
- Identificar gargalos, ineficiências e problemas operacionais mencionados nas reuniões
- Comparar com benchmarks e boas práticas do segmento ${(session.company as any).segment ?? "empresarial"}
- Sugerir soluções práticas e implementáveis
- Priorizar os problemas por impacto e facilidade de resolução
- Ser objetivo, direto e usar linguagem executiva
- Responder sempre em português brasileiro
- Quando identificar problemas, estruture: **Problema → Impacto → Solução sugerida**`

    try {
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
            data: { messages: updatedMessages as any },
        })

        revalidatePath(`/company/${companyId}`)
        return { success: true, message: assistantMessage }
    } catch (err: any) {
        return { error: err?.message ?? "Erro ao conectar com a IA." }
    }
}