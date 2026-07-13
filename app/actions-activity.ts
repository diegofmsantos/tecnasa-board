"use server"

import { prisma } from "@/lib/prisma"
import { requireInternalUser } from "@/lib/auth"
import type { ActivityEntity } from "@prisma/client"

export async function getActivityLogs({
    companyId,
    userId,
    entity,
    take = 100,
}: {
    companyId?: string
    userId?: string
    entity?: ActivityEntity
    take?: number
} = {}) {
    await requireInternalUser()
    return prisma.activityLog.findMany({
        where: {
            ...(companyId ? { companyId } : {}),
            ...(userId ? { userId } : {}),
            ...(entity ? { entity } : {}),
        },
        orderBy: { createdAt: "desc" },
        take,
        include: {
            user: { select: { id: true, name: true } },
        },
    })
}

export async function getActivityStats() {
    await requireInternalUser()
    const [companies, users] = await Promise.all([
        prisma.company.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
        prisma.user.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    ])
    return { companies, users }
}
