import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { TaskCard } from "@/components/task-card"
import { redirect } from "next/navigation"
import { AlertCircle, Clock, Calendar, CheckCircle2, Building2 } from "lucide-react"

export default async function MyTasksPage() {
    const { userId: clerkId } = await auth()
    if (!clerkId) redirect("/login")

    const currentUser = await prisma.user.findUnique({ where: { clerkId } })

    if (!currentUser) {
        return (
            <div className="min-h-screen bg-neutral-bg text-text-main">
                <Sidebar />
                <Header />
                <main className="pl-72 pt-24 pr-8 pb-8">
                    <div className="border-2 border-dashed border-gray-300 rounded-xl h-[300px] flex items-center justify-center text-text-soft">
                        Usuário não encontrado no banco de dados.
                    </div>
                </main>
            </div>
        )
    }

    const myTasks = await prisma.task.findMany({
        where: { userId: currentUser.id },
        include: {
            process: {
                include: {
                    sector: {
                        include: { company: true }
                    }
                }
            }
        },
        orderBy: { dueDate: "asc" }
    })

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const in7days = new Date(today)
    in7days.setDate(today.getDate() + 7)

    // Separa nas faixas
    const overdue = myTasks.filter(t =>
        t.status !== "DONE" && t.dueDate && new Date(t.dueDate) < today
    )
    const upcoming = myTasks.filter(t =>
        t.status !== "DONE" && t.dueDate &&
        new Date(t.dueDate) >= today &&
        new Date(t.dueDate) <= in7days
    )
    const future = myTasks.filter(t =>
        t.status !== "DONE" && (
            !t.dueDate || new Date(t.dueDate) > in7days
        )
    )
    const done = myTasks.filter(t => t.status === "DONE")

    // Agrupa por empresa
    function groupByCompany(tasks: typeof myTasks) {
        return tasks.reduce((acc, task) => {
            const name = task.process.sector.company.name
            if (!acc[name]) acc[name] = []
            acc[name].push(task)
            return acc
        }, {} as Record<string, typeof myTasks>)
    }

    const futureGrouped = groupByCompany(future)
    const doneGrouped = groupByCompany(done)

    function TaskItem({ task }: { task: typeof myTasks[0] }) {
        return (
            <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-tecnasa-primary bg-tecnasa-primary/10 w-fit px-2 py-1 rounded-md uppercase tracking-wider">
                    {task.process.sector.company.name} · {task.process.sector.name} / {task.process.title}
                </span>
                <TaskCard task={task} />
            </div>
        )
    }

    const totalPending = overdue.length + upcoming.length + future.length

    return (
        <div className="min-h-screen bg-neutral-bg text-text-main">
            <Sidebar />
            <Header />

            <main className="pl-72 pt-24 pr-8 pb-8">
                <div className="mb-8 flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-dark-primary">Minhas Tarefas</h1>
                        <p className="text-text-soft mt-1">
                            {totalPending} pendentes · {done.length} concluídas
                        </p>
                    </div>
                </div>

                {myTasks.length === 0 ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-xl h-[300px] flex items-center justify-center text-text-soft">
                        Você não tem nenhuma tarefa atribuída no momento. Bom trabalho! 🎉
                    </div>
                ) : (
                    <div className="space-y-10">

                        {/* ── ATRASADAS ── */}
                        {overdue.length > 0 && (
                            <section>
                                <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-red-200">
                                    <AlertCircle className="h-5 w-5 text-red-500" />
                                    <h2 className="text-lg font-bold text-red-600">Atrasadas</h2>
                                    <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
                                        {overdue.length}
                                    </span>
                                </div>
                                <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {overdue.map(task => (
                                            <TaskItem key={task.id} task={task} />
                                        ))}
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* ── PRÓXIMOS 7 DIAS ── */}
                        {upcoming.length > 0 && (
                            <section>
                                <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-amber-200">
                                    <Clock className="h-5 w-5 text-amber-500" />
                                    <h2 className="text-lg font-bold text-amber-700">Próximos 7 dias</h2>
                                    <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
                                        {upcoming.length}
                                    </span>
                                </div>
                                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {upcoming.map(task => (
                                            <TaskItem key={task.id} task={task} />
                                        ))}
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* ── FUTURAS (agrupadas por empresa) ── */}
                        {Object.keys(futureGrouped).length > 0 && (
                            <section>
                                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                                    <Calendar className="h-5 w-5 text-gray-400" />
                                    <h2 className="text-lg font-bold text-gray-500">Futuras</h2>
                                    <span className="bg-gray-100 text-gray-500 text-xs font-bold px-2 py-0.5 rounded-full">
                                        {future.length}
                                    </span>
                                </div>
                                <div className="space-y-6">
                                    {Object.entries(futureGrouped).map(([companyName, tasks]) => (
                                        <div key={companyName}>
                                            <div className="flex items-center gap-2 mb-3">
                                                <Building2 className="h-4 w-4 text-tecnasa-primary/50" />
                                                <span className="text-sm font-semibold text-gray-400">{companyName}</span>
                                                <span className="text-xs text-gray-300 font-bold">({tasks.length})</span>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-75">
                                                {tasks.map(task => (
                                                    <TaskItem key={task.id} task={task} />
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* ── CONCLUÍDAS (colapsadas) ── */}
                        {done.length > 0 && (
                            <section>
                                <details className="group">
                                    <summary className="flex items-center gap-2 pb-2 border-b border-gray-100 cursor-pointer list-none">
                                        <CheckCircle2 className="h-5 w-5 text-green-400" />
                                        <h2 className="text-lg font-bold text-gray-300">Concluídas</h2>
                                        <span className="bg-green-50 text-green-500 text-xs font-bold px-2 py-0.5 rounded-full">
                                            {done.length}
                                        </span>
                                        <span className="ml-auto text-xs text-gray-300 group-open:hidden">Mostrar</span>
                                        <span className="ml-auto text-xs text-gray-300 hidden group-open:block">Ocultar</span>
                                    </summary>
                                    <div className="mt-4 space-y-6">
                                        {Object.entries(doneGrouped).map(([companyName, tasks]) => (
                                            <div key={companyName}>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <Building2 className="h-4 w-4 text-gray-300" />
                                                    <span className="text-sm font-semibold text-gray-300">{companyName}</span>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-50">
                                                    {tasks.map(task => (
                                                        <TaskItem key={task.id} task={task} />
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </details>
                            </section>
                        )}

                    </div>
                )}
            </main>
        </div>
    )
}