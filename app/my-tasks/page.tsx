import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { TaskCard } from "@/components/task-card";
import { redirect } from "next/navigation";
import { Building2 } from "lucide-react";

export default async function MyTasksPage() {
    const session = await getServerSession();

    if (!session?.user?.email) {
        redirect("/login");
    }

    const currentUser = await prisma.user.findUnique({
        where: { email: session.user.email }
    });

    // Busca as tarefas trazendo a árvore inteira para dar contexto
    const myTasks = await prisma.task.findMany({
        where: { userId: currentUser?.id },
        include: {
            process: {
                include: {
                    sector: {
                        include: { company: true }
                    }
                }
            }
        },
        orderBy: { dueDate: 'asc' } // Organiza pelas que vencem primeiro
    });

    // A MÁGICA: Agrupando as tarefas pelo nome da Empresa
    const groupedTasks = myTasks.reduce((acc, task) => {
        const companyName = task.process.sector.company.name;
        if (!acc[companyName]) {
            acc[companyName] = [];
        }
        acc[companyName].push(task);
        return acc;
    }, {} as Record<string, typeof myTasks>);

    return (
        <div className="min-h-screen bg-neutral-bg text-text-main">
            <Sidebar />
            <Header />

            <main className="pl-72 pt-24 pr-8 pb-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-dark-primary">Minhas Tarefas</h1>
                    <p className="text-text-soft mt-1">Todas as atividades atribuídas a você, organizadas por cliente.</p>
                </div>

                {myTasks.length === 0 ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-xl h-[300px] flex items-center justify-center text-text-soft">
                        Você não tem nenhuma tarefa atribuída no momento. Bom trabalho! 🎉
                    </div>
                ) : (
                    <div className="space-y-10">
                        {/* Renderiza as seções agrupadas por empresa */}
                        {Object.entries(groupedTasks).map(([companyName, tasks]) => (
                            <div key={companyName} className="space-y-4">

                                {/* Cabeçalho da Empresa */}
                                <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
                                    <Building2 className="h-5 w-5 text-tecnasa-primary" />
                                    <h2 className="text-xl font-bold text-dark-primary">{companyName}</h2>
                                    <span className="bg-gray-200 text-gray-700 text-xs font-bold px-2 py-0.5 rounded-full ml-2">
                                        {tasks.length}
                                    </span>
                                </div>

                                {/* Grid de Tarefas daquela Empresa */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {tasks.map((task) => (
                                        <div key={task.id} className="flex flex-col gap-2">
                                            <span className="text-[10px] font-bold text-tecnasa-primary bg-tecnasa-primary/10 w-fit px-2 py-1 rounded-md uppercase tracking-wider">
                                                {task.process.sector.name} / {task.process.title}
                                            </span>
                                            <TaskCard task={task} />
                                        </div>
                                    ))}
                                </div>

                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}