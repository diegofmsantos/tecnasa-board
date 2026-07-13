"use client"

import { deleteTask } from "@/app/actions"
import type { Task } from "@prisma/client"
import { Trash2, Clock, AlertCircle } from "lucide-react"
import { format, isPast, isToday } from "date-fns"
import { ptBR } from "date-fns/locale"

export function TaskCard({ task }: { task: Task }) {

    // Ações de fallback (caso você queira deletar ou mudar pelo menu no futuro)
    async function handleDelete() {
        if (window.confirm("Excluir esta tarefa?")) {
            await deleteTask(task.id, task.processId)
        }
    }

    // Define cores e etiquetas baseadas na prioridade
    const priorityConfig = {
        LOW: { color: "bg-blue-100 text-blue-700", label: "Baixa" },
        MEDIUM: { color: "bg-yellow-100 text-yellow-700", label: "Média" },
        HIGH: { color: "bg-red-100 text-red-700", label: "Alta" },
    }
    const pConfig = priorityConfig[task.priority] || priorityConfig.MEDIUM

    // Lógica de Prazos
    const hasDueDate = !!task.dueDate
    const isOverdue = hasDueDate && isPast(new Date(task.dueDate!)) && !isToday(new Date(task.dueDate!)) && task.status !== "DONE"

    return (
        <div
            draggable
            onDragStart={(e) => {
                e.dataTransfer.setData("taskId", task.id)
            }}
            className={`bg-white border p-4 rounded-lg shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-all ${isOverdue ? "border-red-400" : "border-gray-200"
                }`}
        >
            <div className="flex justify-between items-start mb-2 gap-2">
                <h4 className="font-semibold text-dark-primary text-sm leading-tight">{task.title}</h4>
                <button onClick={handleDelete} className="text-gray-300 hover:text-red-500 transition-colors">
                    <Trash2 className="h-4 w-4" />
                </button>
            </div>

            {task.description && (
                <p className="text-xs text-text-soft mb-3 line-clamp-2">{task.description}</p>
            )}

            {/* Badges de Prioridade e Prazo */}
            <div className="flex flex-wrap gap-2 mt-3 items-center">
                {/* Etiqueta de Prioridade */}
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-wider ${pConfig.color}`}>
                    <AlertCircle className="h-3 w-3" /> {pConfig.label}
                </span>

                {/* Etiqueta de Data */}
                {hasDueDate && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${task.status === "DONE" ? "bg-gray-100 text-gray-500" :
                        isOverdue ? "bg-red-100 text-red-700 animate-pulse" : "bg-gray-100 text-text-soft"
                        }`}>
                        <Clock className="h-3 w-3" />
                        {isOverdue && task.status !== "DONE" ? "Atrasada: " : ""}
                        {format(new Date(task.dueDate!), "dd MMM", { locale: ptBR })}
                    </span>
                )}
            </div>
        </div>
    )
}