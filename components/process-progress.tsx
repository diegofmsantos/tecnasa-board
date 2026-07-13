"use client"

// Componente de % de avanço — adicione no planner-table.tsx dentro do cabeçalho de cada processo

interface ProcessProgressProps {
    tasks: { status: string }[]
    processTitle: string
}

export function ProcessProgress({ tasks, processTitle }: ProcessProgressProps) {
    const total = tasks.length
    const done = tasks.filter(t => t.status === "DONE").length
    const inProgress = tasks.filter(t => t.status === "IN_PROGRESS").length
    const pct = total > 0 ? Math.round((done / total) * 100) : 0

    // Farol automático
    const farol =
        pct === 100 ? { label: "Concluído", color: "bg-green-500", text: "text-green-700" }
            : inProgress > 0 ? { label: "Em Andamento", color: "bg-amber-400", text: "text-amber-700" }
                : { label: "A Iniciar", color: "bg-gray-300", text: "text-gray-500" }

    if (total === 0) return null

    return (
        <div className="flex items-center gap-3 ml-auto mr-2 shrink-0">
            {/* Farol */}
            <span className={`text-xs font-bold ${farol.text} hidden lg:block`}>
                {farol.label}
            </span>

            {/* Barra de progresso */}
            <div className="flex items-center gap-2">
                <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all ${pct === 100 ? "bg-green-500" : pct > 0 ? "bg-amber-400" : "bg-gray-300"
                            }`}
                        style={{ width: `${pct}%` }}
                    />
                </div>
                <span className={`text-xs font-bold tabular-nums ${pct === 100 ? "text-green-600" : pct > 0 ? "text-amber-600" : "text-gray-400"
                    }`}>
                    {pct}%
                </span>
            </div>

            {/* Contagem */}
            <span className="text-xs text-gray-400 hidden xl:block">
                {done}/{total}
            </span>
        </div>
    )
}