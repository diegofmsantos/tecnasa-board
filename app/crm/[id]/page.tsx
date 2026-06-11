import { prisma } from "@/lib/prisma"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Users, CheckCircle2, MessageSquare, Plus } from "lucide-react"
import { notFound } from "next/navigation"
import { addInteraction, convertLeadToCompany } from "@/app/actions"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

type Props = { params: Promise<{ id: string }> }

export default async function LeadPage({ params }: Props) {
    const { id } = await params

    const lead = await prisma.lead.findUnique({
        where: { id },
        include: { interactions: { orderBy: { createdAt: "desc" } } }
    })

    if (!lead) notFound()

    const handleConvert = async () => {
        "use server"
        await convertLeadToCompany(lead.id, lead.name)
    }

    return (
        <div className="min-h-screen bg-neutral-bg text-text-main flex flex-col">
            <Sidebar />
            <Header />

            <main className="pl-72 pt-24 pr-8 pb-8 flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* COLUNA ESQUERDA: DADOS E CONVERSÃO */}
                <div className="lg:col-span-1 space-y-6">
                    <Link href="/crm">
                        <Button variant="ghost" className="mb-2 text-text-soft hover:text-dark-primary -ml-4">
                            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar ao CRM
                        </Button>
                    </Link>

                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <div className="w-12 h-12 bg-tecnasa-primary/10 rounded-lg flex items-center justify-center text-tecnasa-primary mb-4">
                            <Users className="h-6 w-6" />
                        </div>
                        <h1 className="text-2xl font-bold text-dark-primary mb-4">{lead.name}</h1>

                        <div className="space-y-4 text-sm">
                            <div><p className="text-text-soft text-xs uppercase font-bold">CNPJ</p><p className="font-medium">{lead.cnpj || "Não informado"}</p></div>
                            <div><p className="text-text-soft text-xs uppercase font-bold">Segmento</p><p className="font-medium">{lead.segment || "Não informado"}</p></div>
                            <div><p className="text-text-soft text-xs uppercase font-bold">Contato</p><p className="font-medium">{lead.contactRole || "Não informado"}</p></div>
                            <div><p className="text-text-soft text-xs uppercase font-bold">Endereço</p><p className="font-medium">{lead.address || "Não informado"}</p></div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-100">
                            <form action={handleConvert}>
                                <Button type="submit" className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-6 text-lg shadow-md transition-transform hover:scale-105">
                                    <CheckCircle2 className="h-5 w-5 mr-2" /> Efetivar Cliente
                                </Button>
                                <p className="text-xs text-center text-text-soft mt-2 italic">
                                    Isto criará o projeto oficial no Painel de Planejamento.
                                </p>
                            </form>
                        </div>
                    </div>
                </div>

                {/* COLUNA DIREITA: HISTÓRICO E NOTAS */}
                <div className="lg:col-span-2">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-full flex flex-col">
                        <h3 className="text-lg font-bold text-dark-primary mb-6 flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-tecnasa-primary" /> Histórico de Interações
                        </h3>

                        {/* FORMULÁRIO DE NOVA NOTA */}
                        <form action={addInteraction} className="mb-8 flex gap-2">
                            <input type="hidden" name="leadId" value={lead.id} />
                            <input
                                type="text"
                                name="content"
                                required
                                placeholder="Registre uma reunião, ligação, envio de proposta..."
                                className="flex-1 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-tecnasa-primary text-sm"
                            />
                            <Button type="submit" className="bg-tecnasa-primary hover:bg-dark-primary text-white">
                                <Plus className="h-4 w-4 mr-2" /> Adicionar
                            </Button>
                        </form>

                        {/* LINHA DO TEMPO */}
                        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                            {lead.interactions.length === 0 ? (
                                <p className="text-gray-400 text-sm italic text-center py-8">Nenhuma interação registrada ainda.</p>
                            ) : (
                                lead.interactions.map((interaction) => (
                                    <div key={interaction.id} className="bg-gray-50 border border-gray-100 p-4 rounded-lg flex flex-col gap-2">
                                        <p className="text-sm text-dark-primary">{interaction.content}</p>
                                        <span className="text-[10px] text-gray-400 font-bold uppercase">
                                            {format(new Date(interaction.createdAt), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}