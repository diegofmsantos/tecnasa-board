// app/api/import/planning/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireInternalUser, ActionError } from "@/lib/auth"
import type { TaskStatus, TaskPriority } from "@prisma/client"
import * as XLSX from "xlsx"

const MAX_IMPORT_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_IMPORT_EXTENSIONS = [".xlsx", ".xls"]

const STATUS_MAP: Record<string, TaskStatus> = {
    "novo": "TODO",
    "em andamento": "IN_PROGRESS",
    "concluído": "DONE",
    "concluido": "DONE",
}

const PRIORITY_MAP: Record<string, TaskPriority> = {
    "baixa": "LOW",
    "média": "MEDIUM",
    "media": "MEDIUM",
    "alta": "HIGH",
}

function parseDate(value: unknown): Date | null {
    if (!value) return null

    // Número serial do Excel (ex: 45718)
    if (typeof value === "number") {
        const date = XLSX.SSF.parse_date_code(value)
        if (date) return new Date(date.y, date.m - 1, date.d)
    }

    if (typeof value === "string") {
        const trimmed = value.trim()
        if (!trimmed) return null

        // DD/MM/AAAA
        const brMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
        if (brMatch) {
            const [, d, m, y] = brMatch
            return new Date(parseInt(y), parseInt(m) - 1, parseInt(d))
        }

        // ISO ou outros formatos
        const parsed = new Date(trimmed)
        if (!isNaN(parsed.getTime())) return parsed
    }

    return null
}

export async function POST(req: NextRequest) {
    try {
        try {
            await requireInternalUser()
        } catch (err) {
            const message = err instanceof ActionError ? err.message : "Não autenticado."
            return NextResponse.json({ error: message }, { status: 401 })
        }

        const formData = await req.formData()
        const file = formData.get("file") as File | null

        if (!file) {
            return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 })
        }

        const fileName = file.name.toLowerCase()
        if (!ALLOWED_IMPORT_EXTENSIONS.some((ext) => fileName.endsWith(ext))) {
            return NextResponse.json(
                { error: "Formato inválido. Envie um arquivo .xlsx ou .xls." },
                { status: 400 }
            )
        }
        if (file.size > MAX_IMPORT_FILE_SIZE) {
            return NextResponse.json(
                { error: "Arquivo muito grande. O limite é 10MB." },
                { status: 400 }
            )
        }

        const buffer = Buffer.from(await file.arrayBuffer())
        const workbook = XLSX.read(buffer, { type: "buffer", cellDates: false })

        // Lê a aba "Planejamento"
        const sheetName = workbook.SheetNames.find((n) =>
            n.toLowerCase().includes("planejamento")
        )
        if (!sheetName) {
            return NextResponse.json(
                { error: 'Aba "Planejamento" não encontrada na planilha.' },
                { status: 400 }
            )
        }

        const sheet = workbook.Sheets[sheetName]
        const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
            header: 1,
            defval: "",
            range: 3, // começa na linha 4 (índice 3), pulando título, instrução e cabeçalho
        })

        // Carrega todos os usuários e empresas do banco para evitar N+1
        const [allUsers, allCompanies] = await Promise.all([
            prisma.user.findMany({ select: { id: true, name: true } }),
            prisma.company.findMany({
                select: {
                    id: true,
                    name: true,
                    sectors: {
                        select: {
                            id: true,
                            name: true,
                            processes: { select: { id: true, title: true } },
                        },
                    },
                },
            }),
        ])

        // Cache mutável das empresas (setores/processos criados na importação entram aqui)
        const companyCache = new Map(
            allCompanies.map((c) => [c.name.toLowerCase().trim(), c])
        )
        const userCache = new Map(
            allUsers.map((u) => [u.name.toLowerCase().trim(), u.id])
        )

        const results = { imported: 0, skipped: 0, errors: [] as string[] }

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i]
            const lineNum = i + 4 // linha real na planilha

            const companyName = String(row[0] ?? "").trim()
            const sectorName = String(row[1] ?? "").trim()
            const processTitle = String(row[2] ?? "").trim()
            const taskTitle = String(row[3] ?? "").trim()

            // Valida campos obrigatórios
            if (!companyName || !sectorName || !processTitle || !taskTitle) {
                if (companyName || sectorName || processTitle || taskTitle) {
                    // Linha parcialmente preenchida — avisa
                    results.errors.push(`Linha ${lineNum}: campos obrigatórios incompletos — ignorada.`)
                    results.skipped++
                }
                continue
            }

            // Localiza empresa
            const companyKey = companyName.toLowerCase()
            const company = companyCache.get(companyKey)
            if (!company) {
                results.errors.push(
                    `Linha ${lineNum}: empresa "${companyName}" não encontrada na plataforma — ignorada.`
                )
                results.skipped++
                continue
            }

            // Localiza ou cria setor
            let sector = company.sectors.find(
                (s) => s.name.toLowerCase().trim() === sectorName.toLowerCase()
            )
            if (!sector) {
                const created = await prisma.sector.create({
                    data: { name: sectorName, companyId: company.id },
                    select: { id: true, name: true, processes: true },
                })
                company.sectors.push(created)
                sector = created
            }

            // Localiza ou cria processo (etapa)
            let process = sector.processes.find(
                (p) => p.title.toLowerCase().trim() === processTitle.toLowerCase()
            )
            if (!process) {
                const created = await prisma.process.create({
                    data: { title: processTitle, sectorId: sector.id },
                    select: { id: true, title: true },
                })
                sector.processes.push(created)
                process = created
            }

            // Campos opcionais
            const statusRaw = String(row[4] ?? "").trim().toLowerCase()
            const priorityRaw = String(row[5] ?? "").trim().toLowerCase()
            const responsavel = String(row[6] ?? "").trim().toLowerCase()
            const startRaw = row[7]
            const endRaw = row[8]
            const notes = String(row[9] ?? "").trim() || null
            const driveLink = String(row[10] ?? "").trim() || null
            const description = String(row[11] ?? "").trim() || null

            const status = STATUS_MAP[statusRaw] ?? "TODO"
            const priority = PRIORITY_MAP[priorityRaw] ?? "MEDIUM"
            const userId = userCache.get(responsavel) ?? null
            const startDate = parseDate(startRaw)
            const dueDate = parseDate(endRaw)

            await prisma.task.create({
                data: {
                    title: taskTitle,
                    description,
                    status,
                    priority,
                    processId: process.id,
                    userId,
                    startDate,
                    dueDate,
                    notes,
                    driveLink,
                },
            })

            results.imported++
        }

        return NextResponse.json({
            success: true,
            imported: results.imported,
            skipped: results.skipped,
            errors: results.errors,
            message: `${results.imported} atividades importadas com sucesso.${results.skipped > 0 ? ` ${results.skipped} linhas ignoradas.` : ""
                }`,
        })
    } catch (err) {
        console.error("Erro na importação:", err)
        return NextResponse.json(
            { error: "Erro interno ao processar a planilha.", detail: err instanceof Error ? err.message : String(err) },
            { status: 500 }
        )
    }
}