import { ClientsManager } from "@/components/settings/clients-manager"
import { prisma } from "@/lib/prisma"

export default async function SettingsClientsPage() {
    const [clientUsers, companies] = await Promise.all([
        prisma.clientUser.findMany({
            orderBy: { createdAt: "desc" },
            include: { company: { select: { id: true, name: true } } },
        }),
        prisma.company.findMany({
            orderBy: { name: "asc" },
            select: { id: true, name: true },
        }),
    ])

    return <ClientsManager clientUsers={clientUsers} companies={companies} />
}