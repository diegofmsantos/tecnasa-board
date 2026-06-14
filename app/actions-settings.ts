"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

// ─── CONFIGURAÇÕES GERAIS ────────────────────────────────────────────────────

/**
 * Busca todas as configurações como um objeto key→value
 */
export async function getSettings(): Promise<Record<string, string>> {
    const settings = await prisma.setting.findMany()
    return settings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {})
}

/**
 * Salva uma ou mais configurações (upsert)
 */
export async function saveSettings(data: Record<string, string>) {
    await Promise.all(
        Object.entries(data).map(([key, value]) =>
            prisma.setting.upsert({
                where: { key },
                update: { value },
                create: { key, value },
            })
        )
    )
    revalidatePath("/settings/appearance")
    return { success: true }
}

// ─── TIPOS DE ENTREGÁVEL ─────────────────────────────────────────────────────

const DEFAULT_TYPES = [
    { label: "Recebido do Cliente", color: "bg-blue-100 text-blue-700", isDefault: true, order: 1 },
    { label: "Diagnóstico", color: "bg-purple-100 text-purple-700", isDefault: true, order: 2 },
    { label: "Fluxograma", color: "bg-orange-100 text-orange-700", isDefault: true, order: 3 },
    { label: "Apresentação", color: "bg-red-100 text-red-700", isDefault: true, order: 4 },
    { label: "Planilha", color: "bg-green-100 text-green-700", isDefault: true, order: 5 },
    { label: "Contrato", color: "bg-gray-100 text-gray-700", isDefault: true, order: 6 },
    { label: "Outro", color: "bg-gray-100 text-gray-500", isDefault: true, order: 7 },
]

/**
 * Busca todos os tipos — se não existir nenhum, semeia os padrões
 */
export async function getDeliverableTypes() {
    const existing = await prisma.deliverableType.findMany({
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    })

    if (existing.length === 0) {
        // Primeira vez — semeia os tipos padrão
        await prisma.deliverableType.createMany({ data: DEFAULT_TYPES })
        return prisma.deliverableType.findMany({
            orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        })
    }

    return existing
}

/**
 * Cria um novo tipo personalizado
 */
export async function createDeliverableType(label: string, color: string) {
    if (!label.trim()) return { error: "Nome obrigatório." }

    const lastType = await prisma.deliverableType.findFirst({
        orderBy: { order: "desc" },
    })

    await prisma.deliverableType.create({
        data: {
            label: label.trim(),
            color,
            isDefault: false,
            order: (lastType?.order ?? 0) + 1,
        },
    })

    revalidatePath("/settings/deliverables")
    return { success: true }
}

/**
 * Remove um tipo (não remove os padrões)
 */
export async function deleteDeliverableType(id: string) {
    const type = await prisma.deliverableType.findUnique({ where: { id } })
    if (type?.isDefault) return { error: "Tipos padrão não podem ser removidos." }

    await prisma.deliverableType.delete({ where: { id } })
    revalidatePath("/settings/deliverables")
    return { success: true }
}