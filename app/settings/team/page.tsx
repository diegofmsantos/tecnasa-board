import { prisma } from "@/lib/prisma"
import { clerkClient } from "@clerk/nextjs/server"
import { TeamManager } from "@/components/settings/team-manager"

export default async function SettingsTeamPage() {
    const users = await prisma.user.findMany({
        orderBy: { createdAt: "asc" },
        select: { id: true, clerkId: true, name: true, email: true, role: true, createdAt: true },
    })

    // Busca as fotos no Clerk
    const clerk = await clerkClient()
    const usersWithPhoto = await Promise.all(
        users.map(async (user) => {
            try {
                const clerkUser = await clerk.users.getUser(user.clerkId)
                return { ...user, imageUrl: clerkUser.imageUrl ?? null }
            } catch {
                return { ...user, imageUrl: null }
            }
        })
    )

    return <TeamManager users={usersWithPhoto} />
}