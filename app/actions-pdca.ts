"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@clerk/nextjs/server"
import { logActivity } from "@/lib/log-activity"

// ── Atualiza o Pilar do Setor ──────────────────────────────────────────────
export async function updateSectorPilar(sectorId: string, pilar: string, companyId: string) {
    await prisma.sector.update({
        where: { id: sectorId },
        data: { pilar: pilar || null },
    })
    revalidatePath(`/company/${companyId}`)
}

// ── Criar Reunião PDCA ─────────────────────────────────────────────────────
export async function createPdcaMeeting(data: {
    companyId: string
    date: string
    etapaPdca: string
    avancos?: string
    observacoes?: string
    decisoes?: string
    proximosPassos?: string
}) {
    const { userId: clerkId } = await auth()
    const user = clerkId
        ? await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
        : null

    const meeting = await prisma.pdcaMeeting.create({
        data: {
            companyId: data.companyId,
            date: new Date(data.date),
            etapaPdca: data.etapaPdca,
            avancos: data.avancos || null,
            observacoes: data.observacoes || null,
            decisoes: data.decisoes || null,
            proximosPassos: data.proximosPassos || null,
            userId: user?.id ?? null,
        },
    })

    await logActivity({
        action: "CREATED",
        entity: "PROCESS",
        entityId: meeting.id,
        description: `Reunião PDCA (${data.etapaPdca}) registrada`,
        companyId: data.companyId,
    })

    revalidatePath(`/company/${data.companyId}`)
    return meeting
}

// ── Atualizar Reunião PDCA ─────────────────────────────────────────────────
export async function updatePdcaMeeting(meetingId: string, companyId: string, data: {
    date?: string
    etapaPdca?: string
    avancos?: string
    observacoes?: string
    decisoes?: string
    proximosPassos?: string
}) {
    await prisma.pdcaMeeting.update({
        where: { id: meetingId },
        data: {
            ...(data.date && { date: new Date(data.date) }),
            ...(data.etapaPdca && { etapaPdca: data.etapaPdca }),
            avancos: data.avancos ?? null,
            observacoes: data.observacoes ?? null,
            decisoes: data.decisoes ?? null,
            proximosPassos: data.proximosPassos ?? null,
        },
    })
    revalidatePath(`/company/${companyId}`)
}

// ── Deletar Reunião PDCA ───────────────────────────────────────────────────
export async function deletePdcaMeeting(meetingId: string, companyId: string) {
    await prisma.pdcaMeeting.delete({ where: { id: meetingId } })
    revalidatePath(`/company/${companyId}`)
}