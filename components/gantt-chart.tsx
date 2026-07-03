"use client"

import { useState, useEffect } from "react"

interface Task {
    id: string
    title: string
    startDate?: Date | string | null
    dueDate?: Date | string | null
    status: string
}

interface Process {
    id: string
    title: string
    tasks: Task[]
}

interface Sector {
    id: string
    name: string
    processes: Process[]
}

interface GanttChartProps {
    sectors: Sector[]
}

function buildGanttData(sectors: Sector[]) {
    const today = new Date()
    let numId = 1

    // Achata todas as tasks de todos os setores/processos
    const allTasks = sectors.flatMap((sector) =>
        sector.processes.flatMap((process) =>
            process.tasks.map((task) => ({ task, process, sector }))
        )
    )

    // Ordena por data de início
    allTasks.sort((a, b) => {
        const dateA = a.task.startDate ? new Date(a.task.startDate).getTime() : 0
        const dateB = b.task.startDate ? new Date(b.task.startDate).getTime() : 0
        return dateA - dateB
    })

    return allTasks.map(({ task }) => {
        const start = task.startDate ? new Date(task.startDate) : today
        const end = task.dueDate ? new Date(task.dueDate) : new Date(start.getTime() + 3 * 86400000)
        const safeEnd = end <= start ? new Date(start.getTime() + 86400000) : end
        const progress = task.status === "DONE" ? 100 : task.status === "IN_PROGRESS" ? 50 : 0

        return {
            id: numId++,
            text: task.title || "Sem título",
            start,
            end: safeEnd,
            progress,
            type: "task",
        }
    })
}

const scales = [
    { unit: "month", step: 1, format: "%M %Y" },
    { unit: "week", step: 1, format: "Sem %w" },
    { unit: "day", step: 1, format: "%d" },
]

export function GanttChart({ sectors }: GanttChartProps) {
    const [mounted, setMounted] = useState(false)
    const [GanttLib, setGanttLib] = useState<{ Gantt: any; Willow: any } | null>(null)

    useEffect(() => {
        Promise.all([
            import("@svar-ui/react-gantt"),
            import("@svar-ui/react-gantt/all.css" as any),
        ]).then(([mod]) => {
            setGanttLib({ Gantt: mod.Gantt, Willow: mod.Willow })
            setMounted(true)
        })
    }, [])

    const hasRealTasks = sectors.some((s) =>
        s.processes.some((p) => p.tasks.length > 0)
    )

    if (!mounted || !GanttLib) {
        return (
            <div className="h-[600px] w-full bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-center">
                <p className="text-text-soft text-sm">Carregando Gantt...</p>
            </div>
        )
    }

    if (!hasRealTasks) {
        return (
            <div className="h-[600px] w-full bg-gray-50 rounded-xl border border-gray-200 flex flex-col items-center justify-center gap-3 text-text-soft">
                <p className="font-medium">Nenhuma atividade cadastrada.</p>
                <p className="text-sm">Adicione atividades na aba Tabela Principal para visualizá-las aqui.</p>
            </div>
        )
    }

    const tasks = buildGanttData(sectors)
    const { Gantt, Willow } = GanttLib

    return (
        <div style={{ height: "600px", width: "100%" }}>
            <Willow>
                <Gantt
                    tasks={tasks}
                    links={[]}
                    scales={scales}
                    readonly
                    columns={[
                        { id: "text", header: "Atividade", width: 280, flexgrow: 1 },
                        { id: "start", header: "Início", width: 100 },
                        { id: "duration", header: "Duração", width: 100 },
                    ]}
                />
            </Willow>
        </div>
    )
}