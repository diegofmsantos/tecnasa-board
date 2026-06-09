"use client"

import { updateTaskInline, deletePlannerTask, updateSectorName, createPlannerProcess, createPlannerTask, updateProcessName, deletePlannerProcess } from "@/app/actions"
import { useTransition, useState } from "react"
import { ExternalLink, Trash2, Plus, ChevronDown, ChevronRight, Table2, CalendarRange } from "lucide-react"

export function PlannerTable({ sectors, companyId, users }: { sectors: any[], companyId: string, users: any[] }) {
    const [isPending, startTransition] = useTransition()
    const [collapsedProcesses, setCollapsedProcesses] = useState<Record<string, boolean>>({})

    // NOVO: Controle das Abas (Table ou Gantt)
    const [activeTab, setActiveTab] = useState<"TABLE" | "GANTT">("TABLE")

    function toggleProcess(processId: string) {
        setCollapsedProcesses(prev => ({ ...prev, [processId]: !prev[processId] }))
    }

    // --- Funções de Ações ---
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

    const statusColors: Record<string, string> = {
        "TODO": "bg-gray-200 text-gray-700",
        "IN_PROGRESS": "bg-amber-400 text-white",
        "DONE": "bg-green-500 text-white"
    }

    // Cores dinâmicas para o Gantt baseado no index da etapa
    const ganttColors = ['bg-blue-500', 'bg-orange-500', 'bg-purple-500', 'bg-green-500', 'bg-pink-500', 'bg-cyan-500']

    // Lógica para calcular a régua de tempo do Gráfico de Gantt
    let minDate = new Date();
    let maxDate = new Date();
    let hasDates = false;

    sectors.forEach(s => s.processes.forEach((p: any) => p.tasks.forEach((t: any) => {
        if (t.startDate) {
            const d = new Date(t.startDate);
            if (!hasDates || d < minDate) minDate = new Date(d);
            hasDates = true;
        }
        if (t.dueDate) {
            const d = new Date(t.dueDate);
            if (!hasDates || d > maxDate) maxDate = new Date(d);
            hasDates = true;
        }
    })));

    // Adicionamos uma "folga" nas bordas do gráfico (7 dias antes e depois)
    if (!hasDates) {
        minDate.setDate(minDate.getDate() - 7);
        maxDate.setDate(maxDate.getDate() + 21);
    } else {
        minDate.setDate(minDate.getDate() - 5);
        maxDate.setDate(maxDate.getDate() + 10);
    }
    const totalTimeDuration = maxDate.getTime() - minDate.getTime();

    return (
        <div className={`space-y-6 ${isPending ? 'opacity-70 pointer-events-none' : ''}`}>

            {/* ABAS DE NAVEGAÇÃO (ESTILO MONDAY) */}
            <div className="flex items-center gap-6 border-b border-gray-200 px-2">
                <button
                    onClick={() => setActiveTab("TABLE")}
                    className={`flex items-center gap-2 pb-3 px-2 font-medium text-sm transition-colors relative ${activeTab === "TABLE" ? "text-dark-primary" : "text-gray-400 hover:text-gray-600"}`}
                >
                    <Table2 className="h-4 w-4" /> Tabela Principal
                    {activeTab === "TABLE" && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-tecnasa-primary rounded-t-full"></span>}
                </button>
                <button
                    onClick={() => setActiveTab("GANTT")}
                    className={`flex items-center gap-2 pb-3 px-2 font-medium text-sm transition-colors relative ${activeTab === "GANTT" ? "text-dark-primary" : "text-gray-400 hover:text-gray-600"}`}
                >
                    <CalendarRange className="h-4 w-4" /> Visão Gantt
                    {activeTab === "GANTT" && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-tecnasa-primary rounded-t-full"></span>}
                </button>
            </div>

            {sectors.map((sector) => (
                <div key={sector.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

                    <div className="bg-dark-primary text-white px-6 py-4 flex justify-between items-center">
                        <div className="flex items-center gap-2 w-full max-w-lg">
                            <input
                                type="text"
                                defaultValue={sector.name}
                                onBlur={(e) => handleSectorRename(sector.id, e.target.value)}
                                className="text-lg font-bold bg-transparent border-b border-transparent hover:border-white/50 focus:border-white outline-none w-full px-1"
                            />
                        </div>
                        {activeTab === "TABLE" && (
                            <button
                                onClick={() => handleAddProcess(sector.id)}
                                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                            >
                                <Plus className="h-4 w-4" /> Nova Etapa
                            </button>
                        )}
                    </div>

                    <div className="p-4 space-y-6">
                        {sector.processes.length === 0 ? (
                            <p className="text-text-soft text-sm italic py-4">Nenhuma etapa criada.</p>
                        ) : (

                            // SE A ABA FOR TABELA, RENDERIZA O QUE JÁ TÍNHAMOS:
                            activeTab === "TABLE" ? (
                                sector.processes.map((process: any) => {
                                    const isCollapsed = collapsedProcesses[process.id]
                                    return (
                                        <div key={process.id} className="border border-gray-100 rounded-lg overflow-hidden shadow-sm transition-all">
                                            {/* Cabeçalho da Etapa com Sanfona */}
                                            <div className={`bg-tecnasa-primary/10 px-4 py-2 flex items-center justify-between group/stage ${!isCollapsed ? 'border-b border-gray-100' : ''}`}>
                                                <div className="flex items-center gap-2 w-full max-w-md">
                                                    <button onClick={() => toggleProcess(process.id)} className="p-1 hover:bg-tecnasa-primary/20 rounded">
                                                        {isCollapsed ? <ChevronRight className="h-4 w-4 text-tecnasa-primary" /> : <ChevronDown className="h-4 w-4 text-tecnasa-primary" />}
                                                    </button>
                                                    <span className="w-3 h-3 rounded-full bg-tecnasa-primary flex-shrink-0"></span>
                                                    <input
                                                        type="text"
                                                        defaultValue={process.title}
                                                        onBlur={(e) => handleProcessRename(process.id, e.target.value)}
                                                        className="font-bold text-tecnasa-primary bg-transparent border-b border-transparent hover:border-tecnasa-primary/30 focus:border-tecnasa-primary outline-none w-full px-1 py-0.5"
                                                    />
                                                </div>
                                                <button onClick={() => handleDeleteProcess(process.id)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover/stage:opacity-100 px-2">
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
                                                                    <th className="px-4 py-3 font-semibold w-[50px] text-center">Ações</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {process.tasks.length === 0 ? (
                                                                    <tr><td colSpan={8} className="px-4 py-3 text-center text-gray-400 italic">Sem atividades.</td></tr>
                                                                ) : (
                                                                    process.tasks.map((task: any) => (
                                                                        <tr key={task.id} className="border-b border-gray-50 hover:bg-gray-50/50 group">
                                                                            <td className="px-4 py-2 border-r border-gray-100">
                                                                                <input type="text" defaultValue={task.title} onBlur={(e) => handleCellChange(task.id, "title", e.target.value)} className="w-full p-1.5 font-medium text-dark-primary rounded hover:border-gray-200 outline-none bg-transparent" />
                                                                            </td>
                                                                            <td className="px-4 py-2 border-r border-gray-100">
                                                                                <select defaultValue={task.status} onChange={(e) => handleCellChange(task.id, "status", e.target.value)} className={`w-full p-1.5 rounded-md font-bold text-xs outline-none cursor-pointer text-center ${statusColors[task.status] || statusColors["TODO"]}`}>
                                                                                    <option value="TODO" className="bg-white text-gray-700">Novo</option>
                                                                                    <option value="IN_PROGRESS" className="bg-white text-gray-700">Em Andamento</option>
                                                                                    <option value="DONE" className="bg-white text-gray-700">Concluído</option>
                                                                                </select>
                                                                            </td>
                                                                            <td className="px-4 py-2 border-r border-gray-100">
                                                                                <select defaultValue={task.userId || ""} onChange={(e) => handleCellChange(task.id, "userId", e.target.value)} className="w-full p-1.5 rounded-md text-xs hover:border-gray-200 outline-none bg-transparent">
                                                                                    <option value="">Sem responsável</option>
                                                                                    {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                                                                                </select>
                                                                            </td>
                                                                            <td className="px-4 py-2 border-r border-gray-100">
                                                                                <input type="date" defaultValue={task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : ""} onBlur={(e) => handleCellChange(task.id, "startDate", e.target.value)} className="w-full p-1 text-xs text-text-main rounded outline-none bg-transparent" />
                                                                            </td>
                                                                            <td className="px-4 py-2 border-r border-gray-100">
                                                                                <input type="date" defaultValue={task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ""} onBlur={(e) => handleCellChange(task.id, "dueDate", e.target.value)} className="w-full p-1 text-xs text-text-main rounded outline-none bg-transparent" />
                                                                            </td>
                                                                            <td className="px-4 py-2 border-r border-gray-100">
                                                                                <input type="text" placeholder="Adicionar nota..." defaultValue={task.notes || ""} onBlur={(e) => handleCellChange(task.id, "notes", e.target.value)} className="w-full p-1.5 text-xs text-text-main rounded outline-none bg-transparent" />
                                                                            </td>
                                                                            <td className="px-4 py-2 border-r border-gray-100 flex items-center gap-1">
                                                                                <input type="url" placeholder="Colar link..." defaultValue={task.driveLink || ""} onBlur={(e) => handleCellChange(task.id, "driveLink", e.target.value)} className="w-full p-1.5 text-xs text-text-main rounded outline-none bg-transparent" />
                                                                                {task.driveLink && <a href={task.driveLink} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 p-1"><ExternalLink className="h-4 w-4" /></a>}
                                                                            </td>
                                                                            <td className="px-4 py-2 text-center align-middle">
                                                                                <button onClick={() => handleDeleteTask(task.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 w-full flex justify-center"><Trash2 className="h-4 w-4" /></button>
                                                                            </td>
                                                                        </tr>
                                                                    ))
                                                                )}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                    <div className="bg-gray-50/50 px-4 py-2 border-t border-gray-100">
                                                        <button onClick={() => handleAddTask(process.id)} className="text-xs font-bold text-gray-500 hover:text-tecnasa-primary flex items-center gap-1">
                                                            <Plus className="h-3 w-3" /> Adicionar Atividade
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )
                                })

                                // SE A ABA FOR GANTT, RENDERIZA O GRÁFICO:
                            ) : (
                                <div className="border border-gray-200 rounded-lg overflow-hidden bg-white flex">
                                    {/* Lado Esquerdo (Nomes das Tarefas) */}
                                    <div className="w-[300px] flex-shrink-0 border-r border-gray-200 bg-white z-10 flex flex-col relative shadow-[4px_0_10px_rgba(0,0,0,0.02)]">
                                        <div className="h-10 border-b border-gray-100 bg-gray-50"></div> {/* Espaço do Header */}
                                        {sector.processes.map((process: any, pIndex: number) => {
                                            const color = ganttColors[pIndex % ganttColors.length]
                                            return (
                                                <div key={`gantt-title-${process.id}`} className="flex flex-col">
                                                    <div className="px-4 py-2 bg-gray-50/80 border-b border-gray-100 flex items-center gap-2">
                                                        <span className={`w-2 h-2 rounded-full ${color}`}></span>
                                                        <span className="font-bold text-xs text-dark-primary">{process.title}</span>
                                                    </div>
                                                    {process.tasks.map((task: any) => (
                                                        <div key={`gantt-taskname-${task.id}`} className="px-4 py-2 h-10 border-b border-gray-50 flex items-center">
                                                            <span className="text-xs text-text-main truncate" title={task.title}>{task.title || "Sem nome"}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )
                                        })}
                                    </div>

                                    {/* Lado Direito (A Linha do Tempo) */}
                                    <div className="flex-1 overflow-x-auto relative bg-gray-50/30">
                                        {/* Linhas de Grade Verticais de Fundo (Decorativo) */}
                                        <div className="absolute inset-0 flex" style={{ minWidth: '800px' }}>
                                            {Array.from({ length: 12 }).map((_, i) => (
                                                <div key={`grid-${i}`} className="flex-1 border-r border-gray-100 h-full"></div>
                                            ))}
                                        </div>

                                        <div className="h-10 border-b border-gray-100 bg-gray-50 flex items-center px-4 relative z-10" style={{ minWidth: '800px' }}>
                                            <span className="text-xs text-gray-400 font-medium">Linha do Tempo (Início: {minDate.toLocaleDateString('pt-BR')} - Fim: {maxDate.toLocaleDateString('pt-BR')})</span>
                                        </div>

                                        <div className="relative" style={{ minWidth: '800px' }}>
                                            {sector.processes.map((process: any, pIndex: number) => {
                                                const colorClass = ganttColors[pIndex % ganttColors.length]
                                                return (
                                                    <div key={`gantt-timeline-${process.id}`} className="flex flex-col">
                                                        {/* Linha da Etapa (Vazia na régua) */}
                                                        <div className="h-8 border-b border-gray-100"></div>

                                                        {/* Barras das Tarefas */}
                                                        {process.tasks.map((task: any) => {
                                                            // Matemátia do Gantt
                                                            const tStart = task.startDate ? new Date(task.startDate) : new Date();
                                                            const tEnd = task.dueDate ? new Date(task.dueDate) : new Date(tStart.getTime() + 86400000 * 2); // default 2 dias

                                                            // Evita que a barra passe dos limites
                                                            const safeStart = tStart < minDate ? minDate : tStart;
                                                            const safeEnd = tEnd > maxDate ? maxDate : tEnd;

                                                            const leftPercent = ((safeStart.getTime() - minDate.getTime()) / totalTimeDuration) * 100;
                                                            let widthPercent = ((safeEnd.getTime() - safeStart.getTime()) / totalTimeDuration) * 100;

                                                            if (widthPercent <= 0) widthPercent = 2; // Tamanho mínimo para não sumir

                                                            // NOVA LÓGICA DE COR: Cinza se for Novo (TODO), Azul se for Em Andamento ou Concluído
                                                            const taskColor = task.status === "TODO" ? "bg-gray-400" : "bg-blue-500";

                                                            return (
                                                                <div key={`gantt-bar-${task.id}`} className="h-10 border-b border-gray-50 relative flex items-center group">
                                                                    {task.startDate || task.dueDate ? (
                                                                        <div
                                                                            className={`absolute h-5 rounded-sm shadow-sm flex items-center px-2 text-[10px] font-bold text-white overflow-hidden transition-all hover:brightness-110 ${taskColor}`}
                                                                            style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                                                                            title={`${task.title} (${tStart.toLocaleDateString('pt-BR')} até ${tEnd.toLocaleDateString('pt-BR')})`}
                                                                        >
                                                                            {widthPercent > 10 && task.title}
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-[10px] text-gray-400 italic absolute left-4">Sem datas definidas</span>
                                                                    )}
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}