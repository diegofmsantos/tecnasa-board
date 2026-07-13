"use client"

import { useState, useTransition } from "react"
import { Plus, Loader2, ClipboardList, Pencil, Trash2, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { createPdcaMeeting, updatePdcaMeeting, deletePdcaMeeting } from "@/app/actions-pdca"

const ETAPAS_PDCA = [
    { value: "Plan", label: "Plan — Planejar", color: "bg-blue-100 text-blue-800" },
    { value: "Do", label: "Do — Executar", color: "bg-green-100 text-green-800" },
    { value: "Check", label: "Check — Verificar", color: "bg-amber-100 text-amber-800" },
    { value: "Act", label: "Act — Agir", color: "bg-purple-100 text-purple-800" },
]

const ETAPA_COLORS: Record<string, string> = {
    Plan: "bg-blue-100 text-blue-800 border-blue-200",
    Do: "bg-green-100 text-green-800 border-green-200",
    Check: "bg-amber-100 text-amber-800 border-amber-200",
    Act: "bg-purple-100 text-purple-800 border-purple-200",
}

interface Meeting {
    id: string
    date: Date
    etapaPdca: string
    avancos: string | null
    observacoes: string | null
    decisoes: string | null
    proximosPassos: string | null
    user?: { name: string } | null
}

interface PdcaMeetingsProps {
    companyId: string
    meetings: Meeting[]
}

function MeetingCard({ meeting, companyId }: { meeting: Meeting; companyId: string }) {
    const [expanded, setExpanded] = useState(false)
    const [editing, setEditing] = useState(false)
    const [isPending, startTransition] = useTransition()

    const [form, setForm] = useState({
        date: new Date(meeting.date).toISOString().split("T")[0],
        etapaPdca: meeting.etapaPdca,
        avancos: meeting.avancos || "",
        observacoes: meeting.observacoes || "",
        decisoes: meeting.decisoes || "",
        proximosPassos: meeting.proximosPassos || "",
    })

    function handleSave() {
        startTransition(async () => {
            await updatePdcaMeeting(meeting.id, companyId, form)
            setEditing(false)
        })
    }

    function handleDelete() {
        if (!confirm("Excluir esta reunião PDCA?")) return
        startTransition(async () => {
            await deletePdcaMeeting(meeting.id, companyId)
        })
    }

    const etapaColor = ETAPA_COLORS[meeting.etapaPdca] || "bg-gray-100 text-gray-700"
    const dateStr = new Date(meeting.date).toLocaleDateString("pt-BR")

    return (
        <div className={`border rounded-xl overflow-hidden transition-all ${isPending ? "opacity-50" : ""}`}>
            <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold px-2 py-1 rounded-md border ${etapaColor}`}>
                        {meeting.etapaPdca}
                    </span>
                    <span className="text-sm font-medium text-dark-primary">{dateStr}</span>
                    {meeting.user && (
                        <span className="text-xs text-gray-400">por {meeting.user.name}</span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); setEditing(!editing) }} className="text-gray-400 hover:text-tecnasa-primary p-1">
                        <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete() }} className="text-gray-400 hover:text-red-500 p-1">
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    {expanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                </div>
            </div>

            {expanded && (
                <div className="px-4 pb-4 border-t border-gray-100 bg-gray-50/50">
                    {editing ? (
                        <div className="space-y-3 pt-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Data</label>
                                    <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-tecnasa-primary" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Etapa PDCA</label>
                                    <select value={form.etapaPdca} onChange={e => setForm(f => ({ ...f, etapaPdca: e.target.value }))}
                                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-tecnasa-primary">
                                        {ETAPAS_PDCA.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                                    </select>
                                </div>
                            </div>
                            {[
                                { key: "avancos", label: "Avanços / O que foi feito" },
                                { key: "observacoes", label: "Observações / Dúvidas" },
                                { key: "decisoes", label: "Decisões" },
                                { key: "proximosPassos", label: "Próximos Passos" },
                            ].map(({ key, label }) => (
                                <div key={key}>
                                    <label className="text-xs font-semibold text-gray-500 mb-1 block">{label}</label>
                                    <textarea value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                                        rows={2} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-tecnasa-primary resize-none" />
                                </div>
                            ))}
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" size="sm" onClick={() => setEditing(false)}>Cancelar</Button>
                                <Button size="sm" onClick={handleSave} disabled={isPending}
                                    className="bg-tecnasa-primary text-white hover:bg-dark-primary">
                                    {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Salvar"}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4 pt-3">
                            {[
                                { label: "Avanços / O que foi feito", value: meeting.avancos },
                                { label: "Observações / Dúvidas", value: meeting.observacoes },
                                { label: "Decisões", value: meeting.decisoes },
                                { label: "Próximos Passos", value: meeting.proximosPassos },
                            ].map(({ label, value }) => value ? (
                                <div key={label}>
                                    <p className="text-xs font-semibold text-gray-400 mb-1">{label}</p>
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{value}</p>
                                </div>
                            ) : null)}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export function PdcaMeetingsPanel({ companyId, meetings }: PdcaMeetingsProps) {
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [form, setForm] = useState({
        date: new Date().toISOString().split("T")[0],
        etapaPdca: "Do",
        avancos: "",
        observacoes: "",
        decisoes: "",
        proximosPassos: "",
    })

    function handleSubmit() {
        startTransition(async () => {
            await createPdcaMeeting({ companyId, ...form })
            setOpen(false)
            setForm({ date: new Date().toISOString().split("T")[0], etapaPdca: "Do", avancos: "", observacoes: "", decisoes: "", proximosPassos: "" })
        })
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-tecnasa-primary" />
                    <h3 className="font-bold text-dark-primary">Reuniões PDCA</h3>
                    <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full">{meetings.length}</span>
                </div>

                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="bg-tecnasa-primary text-white hover:bg-dark-primary flex items-center gap-1.5">
                            <Plus className="h-3.5 w-3.5" /> Nova Reunião
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-dark-primary">
                                <ClipboardList className="h-5 w-5 text-tecnasa-primary" />
                                Registrar Reunião PDCA
                            </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4 mt-2">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Data *</label>
                                    <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-tecnasa-primary" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Etapa PDCA *</label>
                                    <select value={form.etapaPdca} onChange={e => setForm(f => ({ ...f, etapaPdca: e.target.value }))}
                                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-tecnasa-primary">
                                        {ETAPAS_PDCA.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                                    </select>
                                </div>
                            </div>

                            {[
                                { key: "avancos", label: "Avanços / O que foi feito" },
                                { key: "observacoes", label: "Observações / Dúvidas" },
                                { key: "decisoes", label: "Decisões tomadas" },
                                { key: "proximosPassos", label: "Próximos Passos" },
                            ].map(({ key, label }) => (
                                <div key={key}>
                                    <label className="text-xs font-semibold text-gray-500 mb-1 block">{label}</label>
                                    <textarea value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                                        rows={2} placeholder={`${label}...`}
                                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-tecnasa-primary resize-none" />
                                </div>
                            ))}

                            <div className="flex justify-end gap-2 pt-2">
                                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                                <Button onClick={handleSubmit} disabled={isPending || !form.date}
                                    className="bg-tecnasa-primary text-white hover:bg-dark-primary flex items-center gap-2">
                                    {isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Salvando...</> : "Registrar"}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {meetings.length === 0 ? (
                <div className="border-2 border-dashed border-gray-200 rounded-xl py-8 text-center text-gray-400 text-sm">
                    Nenhuma reunião registrada ainda.
                </div>
            ) : (
                <div className="space-y-2">
                    {meetings.map(m => (
                        <MeetingCard key={m.id} meeting={m} companyId={companyId} />
                    ))}
                </div>
            )}
        </div>
    )
}