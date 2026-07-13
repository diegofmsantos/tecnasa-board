import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { LogoutButton } from "@/components/logout-button"
import Image from "next/image"
import { Building2, FolderOpen, BarChart3, ExternalLink, Layers } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { COMPANY_STATUS_CONFIG } from "@/lib/company-status"

export default async function PortalPage() {
    const { userId: clerkId } = await auth()
    if (!clerkId) redirect("/login")

    // Busca o vínculo cliente → empresa
    const clientUser = await prisma.clientUser.findUnique({
        where: { clerkId },
        include: {
            company: {
                include: {
                    deliverables: {
                        orderBy: { createdAt: "desc" },
                        include: { user: { select: { name: true } } },
                    },
                    sectors: {
                        include: {
                            processes: {
                                include: {
                                    tasks: { orderBy: { createdAt: "asc" } },
                                },
                                orderBy: { createdAt: "asc" },
                            },
                        },
                    },
                },
            },
        },
    })

    if (!clientUser) {
        return (
            <div className="min-h-screen bg-neutral-bg flex items-center justify-center">
                <div className="text-center">
                    <p className="text-dark-primary font-bold text-xl mb-2">Acesso não configurado</p>
                    <p className="text-text-soft text-sm">Entre em contato com a Tecnasa.</p>
                </div>
            </div>
        )
    }

    const company = clientUser.company
    const statusCfg = COMPANY_STATUS_CONFIG[company.status] ?? COMPANY_STATUS_CONFIG.EM_DIAGNOSTICO

    // Métricas rápidas
    const allTasks = company.sectors.flatMap(s => s.processes.flatMap(p => p.tasks))
    const totalTasks = allTasks.length
    const doneTasks = allTasks.filter(t => t.status === "DONE").length
    const donePercent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

    return (
        <div className="min-h-screen bg-neutral-bg">
            {/* Header do Portal */}
            <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-8 fixed top-0 left-0 right-0 z-10 shadow-sm">
                <div className="flex items-center gap-3">
                    <Layers className="text-tecnasa-accent h-6 w-6" />
                    <span className="font-bold text-lg tracking-wider text-dark-primary">TECNASA</span>
                    <span className="text-gray-300 mx-2">|</span>
                    <span className="text-sm text-text-soft font-medium">Portal do Cliente</span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-sm font-semibold text-text-main">{clientUser.name}</p>
                        <p className="text-xs text-text-soft">{clientUser.email}</p>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-tecnasa-primary text-white flex items-center justify-center font-bold text-sm">
                        {clientUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="h-8 w-px bg-gray-200" />
                    <LogoutButton />
                </div>
            </header>

            <main className="pt-24 px-8 pb-8 max-w-6xl mx-auto">
                {/* Cabeçalho da empresa */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 rounded-xl overflow-hidden border border-gray-200 flex items-center justify-center bg-white shadow-sm flex-shrink-0">
                        {company.logoUrl ? (
                            <Image
                                src={company.logoUrl}
                                alt={company.name}
                                width={56}
                                height={56}
                                unoptimized // logoUrl é uma URL externa arbitrária cadastrada pelo admin — sem host fixo para permitir na allowlist de otimização de imagens
                                className="w-full h-full object-contain p-1"
                            />
                        ) : (
                            <Building2 className="h-7 w-7 text-tecnasa-primary" />
                        )}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-dark-primary">{company.name}</h1>
                        <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full border mt-1 ${statusCfg.bg} ${statusCfg.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                            {statusCfg.label}
                        </span>
                    </div>
                </div>

                {/* Cards de métricas */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between shadow-sm">
                        <div>
                            <p className="text-sm text-text-soft">Total de Atividades</p>
                            <p className="text-3xl font-bold text-dark-primary mt-1">{totalTasks}</p>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                            <BarChart3 className="h-6 w-6" />
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between shadow-sm">
                        <div>
                            <p className="text-sm text-text-soft">Concluídas</p>
                            <p className="text-3xl font-bold text-dark-primary mt-1">{doneTasks}</p>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg text-green-600">
                            <BarChart3 className="h-6 w-6" />
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between shadow-sm">
                        <div>
                            <p className="text-sm text-text-soft">Progresso Geral</p>
                            <p className="text-3xl font-bold text-dark-primary mt-1">{donePercent}%</p>
                        </div>
                        <div className="p-3 bg-tecnasa-primary/10 rounded-lg text-tecnasa-primary">
                            <BarChart3 className="h-6 w-6" />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Planejamento simplificado */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                        <h2 className="text-lg font-bold text-dark-primary mb-4">Andamento do Projeto</h2>
                        <div className="space-y-4">
                            {company.sectors.map(sector => (
                                <div key={sector.id}>
                                    <p className="text-xs font-bold text-text-soft uppercase tracking-wider mb-2">{sector.name}</p>
                                    {sector.processes.map(process => {
                                        const tasks = process.tasks
                                        const done = tasks.filter(t => t.status === "DONE").length
                                        const pct = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0
                                        return (
                                            <div key={process.id} className="mb-3">
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span className="font-medium text-text-main">{process.title}</span>
                                                    <span className="text-text-soft">{done}/{tasks.length}</span>
                                                </div>
                                                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                                    <div
                                                        className="bg-tecnasa-primary h-full rounded-full transition-all"
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            ))}
                            {company.sectors.length === 0 && (
                                <p className="text-text-soft text-sm italic">Nenhuma atividade cadastrada ainda.</p>
                            )}
                        </div>
                    </div>

                    {/* Entregáveis */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                        <h2 className="text-lg font-bold text-dark-primary mb-4 flex items-center gap-2">
                            <FolderOpen className="h-5 w-5 text-tecnasa-primary" />
                            Documentos e Entregáveis
                        </h2>
                        {company.deliverables.length === 0 ? (
                            <div className="border-2 border-dashed border-gray-200 rounded-xl h-40 flex items-center justify-center">
                                <p className="text-text-soft text-sm italic">Nenhum entregável disponível ainda.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {company.deliverables.map(d => (
                                    <a
                                        key={d.id}
                                        href={d.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:border-tecnasa-primary hover:bg-tecnasa-primary/5 transition-all group"
                                    >
                                        <div>
                                            <p className="text-sm font-bold text-dark-primary group-hover:text-tecnasa-primary">
                                                {d.name}
                                            </p>
                                            <p className="text-xs text-text-soft mt-0.5">
                                                {format(new Date(d.createdAt), "dd MMM yyyy", { locale: ptBR })}
                                                {d.user?.name && ` · ${d.user.name}`}
                                            </p>
                                        </div>
                                        <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-tecnasa-primary flex-shrink-0" />
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}