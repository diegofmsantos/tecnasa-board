"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { requireInternalUser, toActionError } from "@/lib/auth"

export async function getTaskWithComments(taskId: string) {
  await requireInternalUser()
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

export async function createTaskComment(
  taskId: string,
  content: string,
  companyId: string
) {
  try {
    const user = await requireInternalUser()
    if (!taskId || !content.trim()) return { error: "Conteúdo vazio." }

    await prisma.taskComment.create({
      data: {
        taskId,
        content: content.trim(),
        userId: user.id,
      },
    })

    revalidatePath(`/company/${companyId}`)
    return { success: true }
  } catch (err) {
    return toActionError(err, "Erro ao comentar.")
  }
}

export async function deleteTaskComment(commentId: string, companyId: string) {
  try {
    await requireInternalUser()
    await prisma.taskComment.delete({ where: { id: commentId } })
    revalidatePath(`/company/${companyId}`)
    return { success: true }
  } catch (err) {
    return toActionError(err, "Erro ao remover comentário.")
  }
}
