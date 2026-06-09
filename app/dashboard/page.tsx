import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { BarChart3, FolderKanban, CheckCircle2, CircleDot, Loader2, Building2, Network } from "lucide-react";

export default async function DashboardPage() {
    // Buscas paralelas com a nova estrutura
    const [
        totalCompanies,
        totalSectors,
        totalProcesses,
        totalTasks,
        todoCount,
        inProgressCount,
        doneCount
    ] = await Promise.all([
        prisma.company.count(),
        prisma.sector.count(),
        prisma.process.count(),
        prisma.task.count(),
        prisma.task.count({ where: { status: "TODO" } }),
        prisma.task.count({ where: { status: "IN_PROGRESS" } }),
        prisma.task.count({ where: { status: "DONE" } }),
    ]);

    const donePercentage = totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0;
    const inProgressPercentage = totalTasks > 0 ? Math.round((inProgressCount / totalTasks) * 100) : 0;
    const todoPercentage = totalTasks > 0 ? Math.round((todoCount / totalTasks) * 100) : 0;

    return (
        <div className="min-h-screen bg-neutral-bg text-text-main">
            <Sidebar />
            <Header />

            <main className="pl-72 pt-24 pr-8 pb-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-dark-primary">Indicadores Gerais</h1>
                    <p className="text-text-soft mt-1">Métricas de produtividade e visão macro operacional da Tecnasa.</p>
                </div>

                {/* Grid Expandido com as Novas Entidades */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-text-soft">Clientes (Empresas)</p>
                            <h3 className="text-3xl font-bold text-dark-primary mt-1">{totalCompanies}</h3>
                        </div>
                        <div className="p-3 bg-indigo-500/10 rounded-lg text-indigo-600">
                            <Building2 className="h-6 w-6" />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-text-soft">Setores Mapeados</p>
                            <h3 className="text-3xl font-bold text-dark-primary mt-1">{totalSectors}</h3>
                        </div>
                        <div className="p-3 bg-purple-500/10 rounded-lg text-purple-600">
                            <Network className="h-6 w-6" />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-text-soft">Processos Ativos</p>
                            <h3 className="text-3xl font-bold text-dark-primary mt-1">{totalProcesses}</h3>
                        </div>
                        <div className="p-3 bg-tecnasa-primary/10 rounded-lg text-tecnasa-primary">
                            <FolderKanban className="h-6 w-6" />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-text-soft">Total de Tarefas</p>
                            <h3 className="text-3xl font-bold text-dark-primary mt-1">{totalTasks}</h3>
                        </div>
                        <div className="p-3 bg-blue-500/10 rounded-lg text-blue-600">
                            <BarChart3 className="h-6 w-6" />
                        </div>
                    </div>
                </div>

                {/* Área de Gráficos (Mantém idêntica, apenas os dados mudaram) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm lg:col-span-2">
                        <h3 className="text-lg font-bold text-dark-primary mb-6">Distribuição da Carga de Trabalho</h3>

                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="font-medium text-text-main flex items-center gap-2">
                                        <CircleDot className="h-4 w-4 text-gray-400" /> A Fazer
                                    </span>
                                    <span className="text-text-soft font-bold">{todoCount} ({todoPercentage}%)</span>
                                </div>
                                <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                                    <div className="bg-gray-400 h-full rounded-full transition-all duration-500" style={{ width: `${todoPercentage}%` }} />
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="font-medium text-text-main flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 text-tecnasa-primary" /> Em Andamento
                                    </span>
                                    <span className="text-tecnasa-primary font-bold">{inProgressCount} ({inProgressPercentage}%)</span>
                                </div>
                                <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                                    <div className="bg-tecnasa-primary h-full rounded-full transition-all duration-500" style={{ width: `${inProgressPercentage}%` }} />
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="font-medium text-text-main flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-green-600" /> Concluído
                                    </span>
                                    <span className="text-green-600 font-bold">{doneCount} ({donePercentage}%)</span>
                                </div>
                                <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                                    <div className="bg-green-600 h-full rounded-full transition-all duration-500" style={{ width: `${donePercentage}%` }} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between items-center text-center">
                        <div className="w-full text-left">
                            <h3 className="text-lg font-bold text-dark-primary">Taxa de Conclusão</h3>
                            <p className="text-xs text-text-soft mt-1">Aproveitamento total de entregas da equipe.</p>
                        </div>

                        <div className="my-4 relative flex items-center justify-center w-36 h-36 rounded-full border-8" style={{ borderColor: donePercentage > 0 ? '#10B981' : '#E5E7EB' }}>
                            <div>
                                <span className="text-4xl font-extrabold text-dark-primary">{donePercentage}%</span>
                                <p className="text-[10px] uppercase tracking-wider text-text-soft font-bold mt-0.5">Sucesso</p>
                            </div>
                        </div>

                        <p className="text-xs text-text-soft font-medium italic px-2">
                            {donePercentage >= 70 ? "🔥 Excelente ritmo operacional!" : "💡 Incentive a equipe a concluir as tarefas!"}
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}