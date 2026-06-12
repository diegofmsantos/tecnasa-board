"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

/**
 * Busca uma tarefa completa com comentários e usuário responsável.
 * Usada pelo drawer ao abrir uma tarefa.
 */
export async function getTaskWithComments(taskId: string) {
    return prisma.task.findUnique({
        where: { id: taskId },
        include: {
            user: { select: { id: true, name: true } },
            comments: {
                orderBy: { createdAt: "asc" },
                include: { user: { select: { id: true, name: true } } },
            },
            process: {
                select: {
                    title: true,
                    sector: { select: { name: true } },
                },
            },
        },
    })
}

/**
 * Adiciona um comentário a uma tarefa.
 */
export async function createTaskComment(
    taskId: string,
    content: string,
    companyId: string
) {
    if (!taskId || !content.trim()) return { error: "Conteúdo vazio." }

    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id as string | undefined

    await prisma.taskComment.create({
        data: {
            taskId,
            content: content.trim(),
            userId: userId ?? null,
        },
    })

    revalidatePath(`/company/${companyId}`)
    return { success: true }
}

/**
 * Remove um comentário.
 */
export async function deleteTaskComment(
    commentId: string,
    companyId: string
) {
    await prisma.taskComment.delete({ where: { id: commentId } })
    revalidatePath(`/company/${companyId}`)
}