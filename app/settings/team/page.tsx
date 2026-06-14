import { prisma } from "@/lib/prisma"
import { clerkClient } from "@clerk/nextjs/server"
import { TeamManager } from "@/components/settings/team-manager"

export default async function SettingsTeamPage() {
    const users = await prisma.user.findMany({
        orderBy: { createdAt: "asc" },
        select: { id: true, clerkId: true, name: true, email: true, role: true, createdAt: true },
    })

    return <TeamManager users={users} />
}