import { prisma } from "@/lib/prisma"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Users } from "lucide-react"
import { CreateLeadModal } from "@/components/create-lead-modal"
import { CrmKanban } from "@/components/crm-kanban"

export default async function CRMPage() {
    // Busca todos os leads para preencher o funil
    const leads = await prisma.lead.findMany({
        orderBy: { createdAt: "desc" }
    })

    return (
        <div className="min-h-screen bg-neutral-bg text-text-main flex flex-col">
            <Sidebar />
            <Header />

            <main className="pl-72 pt-24 pr-8 pb-8 flex-1 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <div className="flex items-center gap-2 text-tecnasa-primary mb-1">
                            <Users className="h-4 w-4" />
                            <span className="text-sm font-semibold uppercase tracking-wider">Módulo Comercial</span>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-dark-primary">Pipeline de Vendas</h1>
                    </div>

                    <CreateLeadModal />
                </div>

                {/* Quadro Kanban de CRM */}
                <CrmKanban leads={leads} />

            </main>
        </div>
    )
}