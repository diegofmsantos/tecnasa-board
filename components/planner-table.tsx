"use client"

import { updateTaskInline, deletePlannerTask, updateSectorName, createPlannerProcess, createPlannerTask, updateProcessName, deletePlannerProcess, deletePlannerSector } from "@/app/actions"
import { useTransition, useState } from "react"
import { ExternalLink, Trash2, Plus, ChevronDown, ChevronRight, Table2, CalendarRange, MessageSquare } from "lucide-react"
import { TaskDrawer } from "@/components/task-drawer"
import { ProcessProgress } from "@/components/process-progress"
import type { SectorWithPlanner } from "@/types/company"
import dynamic from "next/dynamic"

const GanttChart = dynamic(
    () => import("@/components/gantt-chart").then((m) => m.GanttChart),
    { ssr: false }
)

interface PlannerTableProps {
    sectors: SectorWithPlanner[]
    companyId: string
    users: { id: string; name: string }[]
}

export function PlannerTable({ sectors, companyId, users }: PlannerTableProps) {
    const [isPending, startTransition] = useTransition()
    const [collapsedProcesses, setCollapsedProcesses] = useState<Record<string, boolean>>(
        () => Object.fromEntries(
            sectors.flatMap(s => s.processes.map((p: { id: string }) => [p.id, true]))
        )
    )
    const [activeTab, setActiveTab] = useState<"TABLE" | "GANTT">("TABLE")
    const [openTaskId, setOpenTaskId] = useState<string | null>(null)

    function toggleProcess(processId: string) {
        setCollapsedProcesses(prev => ({ ...prev, [processId]: !prev[processId] }))
    }

    function handleCellChange(taskId: string, field: string, value: string) {
        startTransition(() => { updateTaskInline(taskId, field, value === "" ? null : value, companyId) })
    }
    function handleDeleteTask(taskId: string) {
        if (window.confirm("Excluir esta atividade?")) startTransition(() => { deletePlannerTask(taskId, companyId) })
    }
    function handleAddTask(processId: string) {
        if (collapsedProcesses[processId]) toggleProcess(processId)
        startTransition(() => { createPlannerTask(processId, companyId) })
    }
    function handleSectorRename(sectorId: string, value: string) {
        startTransition(() => { updateSectorName(sectorId, value, companyId) })
    }
    function handleAddProcess(sectorId: string) {
        startTransition(() => { createPlannerProcess(sectorId, companyId) })
    }
    function handleProcessRename(processId: string, value: string) {
        startTransition(() => { updateProcessName(processId, value, companyId) })
    }
    function handleDeleteProcess(processId: string) {
        if (window.confirm("Atenção: Excluir esta etapa apagará TODAS as atividades dentro dela. Deseja continuar?")) {
            startTransition(() => { deletePlannerProcess(processId, companyId) })
        }
    }
    function handleDeleteSector(sectorId: string) {
        if (window.confirm("Atenção: Apagar este setor removerá TODAS as etapas e atividades dentro dele. Deseja continuar?")) {
            startTransition(() => { deletePlannerSector(sectorId, companyId) })
        }
    }

    const statusColors: Record<string, string> = {
        "TODO": "bg-gray-200 text-gray-700",
        "IN_PROGRESS": "bg-amber-400 text-white",
        "DONE": "bg-green-500 text-white"
    }

    return (
        <>
            <TaskDrawer
                taskId={openTaskId}
                companyId={companyId}
                onClose={() => setOpenTaskId(null)}
            />

            <div className={`space-y-6 ${isPending ? 'opacity-70 pointer-events-none' : ''}`}>

                {/* ABAS */}
                <div className="flex items-center gap-1 border-b border-gray-200 p-2 mb-6 bg-dark-primary rounded-xl">
                    <button
                        onClick={() => setActiveTab("TABLE")}
                        className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === "TABLE" ? "text-tecnasa-accent" : "text-white hover:text-tecnasa-accent"}`}
                    >
                        <Table2 className="h-4 w-4" /> Tabela Principal
                        {activeTab === "TABLE" && (
                            <span className="absolute bottom-1 left-0 w-full h-0.5 bg-tecnasa-accent rounded-t-full" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab("GANTT")}
                        className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === "GANTT" ? "text-tecnasa-accent" : "text-white hover:text-tecnasa-accent"}`}
                    >
                        <CalendarRange className="h-4 w-4" /> Visão Gantt
                        {activeTab === "GANTT" && (
                            <span className="absolute bottom-1 left-0 w-full h-0.5 bg-tecnasa-accent rounded-t-full" />
                        )}
                    </button>
                </div>

                {/* VISÃO GANTT */}
                {activeTab === "GANTT" && (
                    <GanttChart sectors={sectors} />
                )}

                {/* VISÃO TABELA */}
                {activeTab === "TABLE" && sectors.map((sector) => (
                    <div key={sector.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

                        <div className="bg-dark-primary text-white px-6 py-4 flex justify-between items-center">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                <input
                                    type="text"
                                    defaultValue={sector.name}
                                    onBlur={(e) => handleSectorRename(sector.id, e.target.value)}
                                    className="text-lg font-bold bg-transparent border-b border-transparent hover:border-white/50 focus:border-white outline-none w-full px-1"
                                />
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <button
                                    onClick={() => handleAddProcess(sector.id)}
                                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                                >
                                    <Plus className="h-4 w-4" /> Nova Etapa
                                </button>
                                <button
                                    onClick={() => handleDeleteSector(sector.id)}
                                    className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/40 text-red-300 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                                >
                                    <Trash2 className="h-4 w-4" /> Apagar Bloco
                                </button>
                            </div>
                        </div>

                        <div className="p-4 space-y-6">
                            {sector.processes.length === 0 ? (
                                <p className="text-text-soft text-sm italic py-4">Nenhuma etapa criada.</p>
                            ) : (
                                sector.processes.map((process) => {
                                    const isCollapsed = collapsedProcesses[process.id]
                                    return (
                                        <div key={process.id} className="border border-gray-100 rounded-lg overflow-hidden shadow-sm transition-all">
                                            <div className={`bg-tecnasa-primary/10 px-4 py-2 flex items-center gap-2 group/stage ${!isCollapsed ? 'border-b border-gray-100' : ''}`}>
                                                {/* Toggle */}
                                                <button onClick={() => toggleProcess(process.id)} className="p-1 hover:bg-tecnasa-primary/20 rounded flex-shrink-0">
                                                    {isCollapsed
                                                        ? <ChevronRight className="h-4 w-4 text-tecnasa-primary" />
                                                        : <ChevronDown className="h-4 w-4 text-tecnasa-primary" />}
                                                </button>

                                                {/* Bolinha */}
                                                <span className="w-3 h-3 rounded-full bg-tecnasa-primary flex-shrink-0"></span>

                                                {/* Nome da etapa */}
                                                <input
                                                    type="text"
                                                    defaultValue={process.title}
                                                    onBlur={(e) => handleProcessRename(process.id, e.target.value)}
                                                    className="font-bold text-tecnasa-primary bg-transparent border-b border-transparent hover:border-tecnasa-primary/30 focus:border-tecnasa-primary outline-none flex-1 min-w-0 px-1 py-0.5"
                                                />

                                                {/* % de Avanço */}
                                                <ProcessProgress tasks={process.tasks} processTitle={process.title} />

                                                {/* Deletar */}
                                                <button
                                                    onClick={() => handleDeleteProcess(process.id)}
                                                    className="text-gray-400 hover:text-red-500 opacity-0 group-hover/stage:opacity-100 px-2 flex-shrink-0"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>

                                            {!isCollapsed && (
                                                <>
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-sm text-left whitespace-nowrap">
                                                            <thead className="text-[11px] text-text-soft uppercase tracking-wider bg-gray-50 border-b border-gray-100">
                                                                <tr>
                                                                    <th className="px-4 py-3 font-semibold min-w-[250px]">Atividade</th>
                                                                    <th className="px-4 py-3 font-semibold w-[140px]">Status</th>
                                                                    <th className="px-4 py-3 font-semibold w-[160px]">Responsável</th>
                                                                    <th className="px-4 py-3 font-semibold w-[130px]">Início</th>
                                                                    <th className="px-4 py-3 font-semibold w-[130px]">Fim</th>
                                                                    <th className="px-4 py-3 font-semibold min-w-[200px]">Observações</th>
                                                                    <th className="px-4 py-3 font-semibold w-[130px]">Drive</th>
                                                                    <th className="px-4 py-3 font-semibold w-[80px] text-center">Coment.</th>
                                                                    <th className="px-4 py-3 font-semibold w-[50px] text-center">Ações</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {process.tasks.length === 0 ? (
                                                                    <tr>
                                                                        <td colSpan={9} className="px-4 py-3 text-center text-gray-400 italic">Sem atividades.</td>
                                                                    </tr>
                                                                ) : (
                                                                    process.tasks.map((task) => (
                                                                        <tr key={task.id} className="border-b border-gray-50 hover:bg-gray-50/50 group">
                                                                            <td className="px-4 py-2 border-r border-gray-100">
                                                                                <div className="flex items-center gap-2">
                                                                                    <input
                                                                                        type="text"
                                                                                        defaultValue={task.title}
                                                                                        onBlur={(e) => handleCellChange(task.id, "title", e.target.value)}
                                                                                        className="w-full p-1.5 font-medium text-dark-primary rounded hover:border-gray-200 outline-none bg-transparent"
                                                                                    />
                                                                                    <button
                                                                                        onClick={() => setOpenTaskId(task.id)}
                                                                                        title="Ver detalhes e comentários"
                                                                                        className="flex-shrink-0 text-gray-300 hover:text-tecnasa-primary opacity-0 group-hover:opacity-100 transition-colors p-1"
                                                                                    >
                                                                                        <MessageSquare className="h-4 w-4" />
                                                                                    </button>
                                                                                </div>
                                                                            </td>
                                                                            <td className="px-4 py-2 border-r border-gray-100">
                                                                                <select
                                                                                    defaultValue={task.status}
                                                                                    onChange={(e) => handleCellChange(task.id, "status", e.target.value)}
                                                                                    className={`w-full p-1.5 rounded-md font-bold text-xs outline-none cursor-pointer text-center ${statusColors[task.status] || statusColors["TODO"]}`}
                                                                                >
                                                                                    <option value="TODO" className="bg-white text-gray-700">Novo</option>
                                                                                    <option value="IN_PROGRESS" className="bg-white text-gray-700">Em Andamento</option>
                                                                                    <option value="DONE" className="bg-white text-gray-700">Concluído</option>
                                                                                </select>
                                                                            </td>
                                                                            <td className="px-4 py-2 border-r border-gray-100">
                                                                                <select
                                                                                    defaultValue={task.userId || ""}
                                                                                    onChange={(e) => handleCellChange(task.id, "userId", e.target.value)}
                                                                                    className="w-full p-1.5 rounded-md text-xs hover:border-gray-200 outline-none bg-transparent"
                                                                                >
                                                                                    <option value="">Sem responsável</option>
                                                                                    {users.map((u) => (
                                                                                        <option key={u.id} value={u.id}>{u.name}</option>
                                                                                    ))}
                                                                                </select>
                                                                            </td>
                                                                            <td className="px-4 py-2 border-r border-gray-100">
                                                                                <input
                                                                                    type="date"
                                                                                    defaultValue={task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : ""}
                                                                                    onBlur={(e) => handleCellChange(task.id, "startDate", e.target.value)}
                                                                                    className="w-full p-1 text-xs text-text-main rounded outline-none bg-transparent"
                                                                                />
                                                                            </td>
                                                                            <td className="px-4 py-2 border-r border-gray-100">
                                                                                <input
                                                                                    type="date"
                                                                                    defaultValue={task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ""}
                                                                                    onBlur={(e) => handleCellChange(task.id, "dueDate", e.target.value)}
                                                                                    className="w-full p-1 text-xs text-text-main rounded outline-none bg-transparent"
                                                                                />
                                                                            </td>
                                                                            <td className="px-4 py-2 border-r border-gray-100">
                                                                                <input
                                                                                    type="text"
                                                                                    placeholder="Adicionar nota..."
                                                                                    defaultValue={task.notes || ""}
                                                                                    onBlur={(e) => handleCellChange(task.id, "notes", e.target.value)}
                                                                                    className="w-full p-1.5 text-xs text-text-main rounded outline-none bg-transparent"
                                                                                />
                                                                            </td>
                                                                            <td className="px-4 py-2 border-r border-gray-100">
                                                                                <div className="flex items-center gap-1">
                                                                                    <input
                                                                                        type="url"
                                                                                        placeholder="Colar link..."
                                                                                        defaultValue={task.driveLink || ""}
                                                                                        onBlur={(e) => handleCellChange(task.id, "driveLink", e.target.value)}
                                                                                        className="w-full p-1.5 text-xs text-text-main rounded outline-none bg-transparent"
                                                                                    />
                                                                                    {task.driveLink && (
                                                                                        <a href={task.driveLink} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 p-1 flex-shrink-0">
                                                                                            <ExternalLink className="h-4 w-4" />
                                                                                        </a>
                                                                                    )}
                                                                                </div>
                                                                            </td>
                                                                            <td className="px-4 py-2 border-r border-gray-100 text-center">
                                                                                <button
                                                                                    onClick={() => setOpenTaskId(task.id)}
                                                                                    className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-tecnasa-primary transition-colors"
                                                                                >
                                                                                    <MessageSquare className="h-3.5 w-3.5" />
                                                                                    {task._count?.comments > 0 && (
                                                                                        <span className="font-bold text-tecnasa-primary">{task._count.comments}</span>
                                                                                    )}
                                                                                </button>
                                                                            </td>
                                                                            <td className="px-4 py-2 text-center align-middle">
                                                                                <button
                                                                                    onClick={() => handleDeleteTask(task.id)}
                                                                                    className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 w-full flex justify-center"
                                                                                >
                                                                                    <Trash2 className="h-4 w-4" />
                                                                                </button>
                                                                            </td>
                                                                        </tr>
                                                                    ))
                                                                )}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                    <div className="bg-gray-50/50 px-4 py-2 border-t border-gray-100">
                                                        <button
                                                            onClick={() => handleAddTask(process.id)}
                                                            className="text-xs font-bold text-gray-500 hover:text-tecnasa-primary flex items-center gap-1"
                                                        >
                                                            <Plus className="h-3 w-3" /> Adicionar Atividade
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </>
    )
}