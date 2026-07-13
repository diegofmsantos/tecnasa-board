"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { requireInternalUser, toActionError } from "@/lib/auth"

/**
 * Busca as notificações do usuário logado
 */
export async function getNotifications() {
    const user = await requireInternalUser().catch(() => null)
    if (!user) return []

    return prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 50,
    })
}

/**
 * Conta notificações não lidas do usuário logado
 */
export async function getUnreadCount() {
    const user = await requireInternalUser().catch(() => null)
    if (!user) return 0

    return prisma.notification.count({
        where: { userId: user.id, read: false },
    })
}

/**
 * Marca uma notificação como lida — só o dono da notificação pode fazer isso.
 */
export async function markAsRead(notificationId: string) {
    try {
        const user = await requireInternalUser()
        await prisma.notification.updateMany({
            where: { id: notificationId, userId: user.id },
            data: { read: true },
        })
        revalidatePath("/")
        return { success: true }
    } catch (err) {
        return toActionError(err, "Erro ao marcar notificação como lida.")
    }
}

/**
 * Marca todas as notificações do usuário como lidas
 */
export async function markAllAsRead() {
    try {
        const user = await requireInternalUser()
        await prisma.notification.updateMany({
            where: { userId: user.id, read: false },
            data: { read: true },
        })
        revalidatePath("/")
        return { success: true }
    } catch (err) {
        return toActionError(err, "Erro ao marcar notificações como lidas.")
    }
}

/**
 * Gera notificações de prazo para todos os usuários com tarefas:
 * - DANGER: tarefas já atrasadas
 * - WARNING: tarefas que vencem nos próximos 2 dias
 *
 * Deve ser chamada uma vez por dia (ex: via cron ou ao carregar o painel)
 * Evita duplicatas verificando se já existe notificação para o mesmo taskId no mesmo dia
 */
export async function generateDeadlineNotifications() {
    await requireInternalUser()

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const in2Days = new Date(today.getTime() + 2 * 86400000)

    // Tarefas atrasadas (dueDate < hoje, status != DONE, com responsável)
    const overdueTasks = await prisma.task.findMany({
        where: {
            dueDate: { lt: today },
            status: { not: "DONE" },
            userId: { not: null },
        },
        include: {
            user: true,
            process: { include: { sector: { include: { company: true } } } },
        },
    })

    // Tarefas vencendo em até 2 dias
    const upcomingTasks = await prisma.task.findMany({
        where: {
            dueDate: { gte: today, lte: in2Days },
            status: { not: "DONE" },
            userId: { not: null },
        },
        include: {
            user: true,
            process: { include: { sector: { include: { company: true } } } },
        },
    })

    for (const task of overdueTasks) {
        if (!task.userId) continue

        // Evita duplicata no mesmo dia
        const existing = await prisma.notification.findFirst({
            where: {
                taskId: task.id,
                userId: task.userId,
                type: "DANGER",
                createdAt: { gte: today },
            },
        })
        if (existing) continue

        const company = task.process.sector.company.name
        await prisma.notification.create({
            data: {
                userId: task.userId,
                taskId: task.id,
                type: "DANGER",
                title: "Tarefa atrasada",
                message: `"${task.title}" em ${company} está atrasada.`,
            },
        })
    }

    for (const task of upcomingTasks) {
        if (!task.userId) continue

        const existing = await prisma.notification.findFirst({
            where: {
                taskId: task.id,
                userId: task.userId,
                type: "WARNING",
                createdAt: { gte: today },
            },
        })
        if (existing) continue

        const company = task.process.sector.company.name
        const dueDate = task.dueDate!
        const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / 86400000)
        const when = diffDays === 0 ? "hoje" : diffDays === 1 ? "amanhã" : `em ${diffDays} dias`

        await prisma.notification.create({
            data: {
                userId: task.userId,
                taskId: task.id,
                type: "WARNING",
                title: "Prazo se aproximando",
                message: `"${task.title}" em ${company} vence ${when}.`,
            },
        })
    }
}
