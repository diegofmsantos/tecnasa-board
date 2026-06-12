"use client"

import { useState, useEffect } from "react"
import { Gantt, Willow } from "@svar-ui/react-gantt"
import "@svar-ui/react-gantt/all.css"

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

// Converte os dados da Tecnasa para o formato do SVAR Gantt
function buildGanttData(sectors: Sector[]) {
    const tasks: any[] = []
    const today = new Date()

    // ID numérico sequencial (SVAR exige números, não strings)
    let numId = 1
    // Mapa para converter string IDs em numéricos
    const idMap: Record<string, number> = {}

    sectors.forEach((sector) => {
        // Setor vira um grupo pai (summary)
        const sectorNumId = numId++
        idMap[sector.id] = sectorNumId

        tasks.push({
            id: sectorNumId,
            text: sector.name,
            type: "summary",
            open: true,
            // Datas do setor = span de todos os filhos (calculado depois)
            start: today,
            end: new Date(today.getTime() + 7 * 86400000),
        })

        sector.processes.forEach((process) => {
            // Processo vira outro grupo pai dentro do setor
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

                const start = task.startDate
                    ? new Date(task.startDate)
                    : today

                const end = task.dueDate
                    ? new Date(task.dueDate)
                    : new Date(start.getTime() + 3 * 86400000) // +3 dias se não tiver prazo

                // Garante que end > start
                const safeEnd = end <= start
                    ? new Date(start.getTime() + 86400000)
                    : end

                const progress =
                    task.status === "DONE" ? 100
                        : task.status === "IN_PROGRESS" ? 50
                            : 0

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

    useEffect(() => {
        setMounted(true)
    }, [])

    const tasks = buildGanttData(sectors)
    const hasData = sectors.some((s) =>
        s.processes.some((p) => p.tasks.length > 0)
    )

    if (!mounted) {
        return (
            <div className="h-[600px] w-full bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-center">
                <p className="text-text-soft text-sm">Carregando Gantt...</p>
            </div>
        )
    }

    if (!hasData) {
        return (
            <div className="h-[600px] w-full bg-gray-50 rounded-xl border border-gray-200 flex flex-col items-center justify-center gap-3 text-text-soft">
                <p className="font-medium">Nenhuma atividade com datas definidas.</p>
                <p className="text-sm">Adicione datas de início e fim nas atividades para visualizá-las aqui.</p>
            </div>
        )
    }

    return (
        <div style={{ height: "600px", width: "100%" }}>
            <Willow>
                <Gantt
                    tasks={tasks}
                    links={[]}
                    scales={scales}
                    readonly
                />
            </Willow>
        </div>
    )
}