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
    const tasks: any[] = []
    const today = new Date()
    let numId = 1
    const idMap: Record<string, number> = {}

    sectors.forEach((sector) => {
        // Só inclui setor se tiver ao menos um processo com tasks
        const processesWithTasks = sector.processes.filter((p) => p.tasks.length > 0)
        if (processesWithTasks.length === 0) return

        const sectorNumId = numId++
        idMap[sector.id] = sectorNumId
        tasks.push({
            id: sectorNumId,
            text: sector.name,
            type: "summary",
            open: true,
            start: today,
            end: new Date(today.getTime() + 7 * 86400000),
        })

        processesWithTasks.forEach((process) => {
            const processNumId = numId++
            idMap[process.id] = processNumId
            tasks.push({
                id: processNumId,
                text: process.title,
                type: "summary",
                open: true,
                parent: sectorNumId,
                start: today,
                end: new Date(today.getTime() + 7 * 86400000),
            })

            process.tasks.forEach((task) => {
                const taskNumId = numId++
                idMap[task.id] = taskNumId
                const start = task.startDate ? new Date(task.startDate) : today
                const end = task.dueDate ? new Date(task.dueDate) : new Date(start.getTime() + 3 * 86400000)
                const safeEnd = end <= start ? new Date(start.getTime() + 86400000) : end
                const progress = task.status === "DONE" ? 100 : task.status === "IN_PROGRESS" ? 50 : 0
                tasks.push({
                    id: taskNumId,
                    text: task.title || "Sem título",
                    start,
                    end: safeEnd,
                    progress,
                    parent: processNumId,
                    type: "task",
                })
            })
        })
    })

    return tasks
}

const scales = [
    { unit: "month", step: 1, format: "%M %Y" },
    { unit: "week", step: 1, format: "Sem %w" },
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
                <Gantt tasks={tasks} links={[]} scales={scales} readonly />
            </Willow>
        </div>
    )
}