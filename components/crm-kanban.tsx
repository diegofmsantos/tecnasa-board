"use client"

import { useState, useTransition } from "react"
import { updateLeadStatus, convertLeadToCompany, deleteLead } from "@/app/actions"
import type { Lead } from "@prisma/client"
import Link from "next/link"
import { Building, MapPin, Briefcase, CheckCircle2, Trash2 } from "lucide-react"

// As etapas definidas pelo seu sócio
const FUNNEL_STAGES = [
    { id: "LEADS", title: "Leads", color: "bg-gray-200 border-gray-300 text-gray-700" },
    { id: "DIAGNOSTICO", title: "Diagnóstico", color: "bg-blue-100 border-blue-300 text-blue-700" },
    { id: "PROPOSTA", title: "Proposta", color: "bg-yellow-100 border-yellow-300 text-yellow-700" },
    { id: "FECHAMENTO", title: "Fechamento", color: "bg-orange-100 border-orange-300 text-orange-700" },
    { id: "GANHO", title: "Ganho", color: "bg-green-100 border-green-300 text-green-700" },
    { id: "PERDIDO", title: "Perdido", color: "bg-red-100 border-red-300 text-red-700" }
]

export function CrmKanban({ leads }: { leads: Lead[] }) {
    const [isPending, startTransition] = useTransition()

    // Estado para controlar o Pop-up de conversão
    const [leadToConvert, setLeadToConvert] = useState<{ id: string, name: string } | null>(null)

    function handleDrop(e: React.DragEvent, newStatus: string) {
        e.preventDefault()
        const leadId = e.dataTransfer.getData("leadId")
        const leadName = e.dataTransfer.getData("leadName")

        if (!leadId) return

        // Se a coluna for GANHO, abrimos o Pop-up e paramos a ação
        if (newStatus === "GANHO") {
            setLeadToConvert({ id: leadId, name: leadName })
            return
        }

        // Se for outra coluna, apenas movemos o card
        startTransition(() => {
            updateLeadStatus(leadId, newStatus)
        })
    }

    function handleDragOver(e: React.DragEvent) {
        e.preventDefault()
    }

    // Função que roda quando o usuário confirma no Pop-up
    function confirmConversion() {
        if (!leadToConvert) return
        startTransition(() => {
            convertLeadToCompany(leadToConvert.id, leadToConvert.name)
        })
    }

    return (
        <>
            <div className={`flex gap-4 flex-1 overflow-x-auto pb-4 ${isPending ? 'opacity-70 pointer-events-none' : ''}`}>
                {FUNNEL_STAGES.map((stage) => {
                    const stageLeads = leads.filter(l => l.status === stage.id || (stage.id === "LEADS" && l.status === "PROSPECT"))

                    return (
                        <div
                            key={stage.id}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, stage.id)}
                            className="min-w-[280px] w-[280px] bg-gray-50/50 rounded-xl p-3 flex flex-col border-2 border-transparent hover:border-gray-200 transition-colors"
                        >
                            <div className={`px-3 py-2 rounded-lg border mb-4 flex justify-between items-center ${stage.color}`}>
                                <h3 className="font-bold text-sm">{stage.title}</h3>
                                <span className="bg-white/50 px-2 py-0.5 rounded-full text-xs font-black">
                                    {stageLeads.length}
                                </span>
                            </div>

                            <div className="flex flex-col gap-3 flex-1 overflow-y-auto pr-1 min-h-[200px]">
                                {stageLeads.map((lead) => (
                                    <div
                                        key={lead.id}
                                        draggable
                                        onDragStart={(e) => {
                                            e.dataTransfer.setData("leadId", lead.id)
                                            e.dataTransfer.setData("leadName", lead.name)
                                        }}
                                        className="bg-white border border-gray-200 p-3 rounded-lg shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md hover:border-tecnasa-primary transition-all group"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <Link href={`/crm/${lead.id}`} className="flex-1 min-w-0">
                                                <h4 className="font-bold text-dark-primary text-sm mb-2 group-hover:text-tecnasa-primary transition-colors flex items-center gap-2">
                                                    <Building className="h-4 w-4" /> {lead.name}
                                                </h4>
                                                <div className="text-xs text-text-soft space-y-1">
                                                    {lead.segment && <p className="flex items-center gap-1 truncate"><Briefcase className="h-3 w-3" /> {lead.segment}</p>}
                                                    {lead.address && <p className="flex items-center gap-1 truncate"><MapPin className="h-3 w-3" /> {lead.address}</p>}
                                                </div>
                                            </Link>

                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    if (window.confirm(`Excluir "${lead.name}"?`)) {
                                                        startTransition(() => { deleteLead(lead.id) })
                                                    }
                                                }}
                                                className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0 p-1"
                                                title="Excluir prospecto"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* POP-UP DE CONFIRMAÇÃO DE GANHO */}
            {leadToConvert && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4 mx-auto">
                            <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <h2 className="text-2xl font-bold text-center text-dark-primary mb-2">Negócio Fechado! 🎉</h2>
                        <p className="text-center text-text-soft mb-6">
                            Você arrastou <strong>{leadToConvert.name}</strong> para Ganho. Deseja efetivar este cliente e criar o painel de projetos agora mesmo?
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setLeadToConvert(null)}
                                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg transition-colors"
                                disabled={isPending}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmConversion}
                                className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-colors"
                                disabled={isPending}
                            >
                                {isPending ? "Criando..." : "Confirmar e Criar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}