import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"

interface LogOptions {
  action:      "CREATED" | "UPDATED" | "DELETED" | "STATUS_CHANGED" | "COMMENTED"
  entity:      "TASK" | "PROCESS" | "SECTOR" | "COMPANY" | "DELIVERABLE" | "COMMENT"
  entityId?:   string
  description: string
  companyId?:  string
}

export async function logActivity(options: LogOptions) {
  try {
    const { userId: clerkId } = await auth()
    const user = clerkId
      ? await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
      : null

    await prisma.activityLog.create({
      data: {
        action:      options.action,
        entity:      options.entity,
        entityId:    options.entityId,
        description: options.description,
        companyId:   options.companyId,
        userId:      user?.id ?? null,
      },
    })
  } catch {
    // Log nunca deve quebrar a operação principal
  }
}