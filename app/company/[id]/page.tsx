import { prisma } from "@/lib/prisma"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Building2, BarChart2 } from "lucide-react"
import { notFound } from "next/navigation"
import { PlannerTable } from "@/components/planner-table"
import { CreateSectorModal } from "@/components/create-sector-modal"

type Props = {
    params: Promise<{ id: string }>
}

export default async function CompanyPage({ params }: Props) {
    const { id } = await params

    // 1. Busca os Usuários para o Dropdown da tabela
    const users = await prisma.user.findMany({ select: { id: true, name: true } })

    // 2. Busca a Empresa com a "Escadinha" completa (Projetos > Etapas > Atividades)
    const company = await prisma.company.findUnique({
        where: { id },
        include: {
            sectors: {
                include: {
                    processes: { 
                        include: {
                            tasks: { orderBy: { createdAt: 'asc' } } 
                        },
                        orderBy: { createdAt: 'asc' }
                    }
                },
                orderBy: { name: 'asc' }
            }
        }
    })

    if (!company) notFound()

    return (
        <div className="min-h-screen bg-neutral-bg text-text-main flex flex-col">
            <Sidebar />
            <Header />

            <main className="pl-72 pt-24 pr-8 pb-8 flex-1">
                <Link href="/">
                    <Button variant="ghost" className="mb-4 text-text-soft hover:text-dark-primary -ml-4">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Voltar para Clientes
                    </Button>
                </Link>

                <div className="flex items-center justify-between mb-8">
                    <div>
                        <div className="flex items-center gap-2 text-tecnasa-primary mb-1">
                            <Building2 className="h-4 w-4" />
                            <span className="text-sm font-semibold uppercase tracking-wider">Painel de Planejamento</span>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-dark-primary">{company.name}</h1>
                    </div>

                    <div className="flex gap-3">
                        <Link href={`/company/${company.id}/dashboard`}>
                            <Button variant="outline" className="border-tecnasa-primary text-tecnasa-primary hover:bg-tecnasa-primary/10 shadow-sm">
                                <BarChart2 className="h-4 w-4 mr-2" /> Relatório Executivo
                            </Button>
                        </Link>

                        {/* Como mudamos a nomenclatura, renomeamos os botões para refletir o novo modelo */}
                        <CreateSectorModal companyId={company.id} />
                    </div>
                </div>

                {/* Nossa Mega Tabela no estilo Monday */}
                <PlannerTable sectors={company.sectors} companyId={company.id} users={users} />

            </main>
        </div>
    )
}