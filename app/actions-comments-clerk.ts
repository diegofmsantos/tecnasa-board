"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@clerk/nextjs/server"

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

export async function createTaskComment(
  taskId: string,
  content: string,
  companyId: string
) {
  if (!taskId || !content.trim()) return { error: "Conteúdo vazio." }

  const { userId: clerkId } = await auth()

  // Busca o User interno pelo clerkId
  const user = clerkId
    ? await prisma.user.findUnique({ where: { clerkId } })
    : null

  await prisma.taskComment.create({
    data: {
      taskId,
      content: content.trim(),
      userId: user?.id ?? null,
    },
  })

  revalidatePath(`/company/${companyId}`)
  return { success: true }
}

export async function deleteTaskComment(commentId: string, companyId: string) {
  await prisma.taskComment.delete({ where: { id: commentId } })
  revalidatePath(`/company/${companyId}`)
}