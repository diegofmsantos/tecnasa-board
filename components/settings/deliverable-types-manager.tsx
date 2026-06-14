"use client"

import { useState, useTransition } from "react"
import { createDeliverableType, deleteDeliverableType } from "@/app/actions-settings"
import { Tag, Plus, Trash2, Check, X, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"

const COLOR_OPTIONS = [
    { label: "Azul", value: "bg-blue-100 text-blue-700" },
    { label: "Roxo", value: "bg-purple-100 text-purple-700" },
    { label: "Verde", value: "bg-green-100 text-green-700" },
    { label: "Laranja", value: "bg-orange-100 text-orange-700" },
    { label: "Vermelho", value: "bg-red-100 text-red-700" },
    { label: "Amarelo", value: "bg-yellow-100 text-yellow-700" },
    { label: "Cinza", value: "bg-gray-100 text-gray-700" },
]

interface DeliverableType {
    id: string
    label: string
    color: string
    isDefault: boolean
    order: number
}

export function DeliverableTypesManager({ types: initial }: { types: DeliverableType[] }) {
    const [types, setTypes] = useState(initial)
    const [showForm, setShowForm] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState("")
    const [form, setForm] = useState({ label: "", color: COLOR_OPTIONS[0].value })

    function handleAdd() {
        setError("")
        if (!form.label.trim()) { setError("Nome obrigatório."); return }

        startTransition(async () => {
            const result = await createDeliverableType(form.label, form.color)
            if (result.error) { setError(result.error); return }
            setTypes((prev) => [
                ...prev,
                { id: crypto.randomUUID(), label: form.label, color: form.color, isDefault: false, order: prev.length + 1 },
            ])
            setForm({ label: "", color: COLOR_OPTIONS[0].value })
            setShowForm(false)
        })
    }

    function handleDelete(id: string, isDefault: boolean) {
        if (isDefault) return
        startTransition(async () => {
            await deleteDeliverableType(id)
            setTypes((prev) => prev.filter((t) => t.id !== id))
        })
    }

    return (
        <div className={isPending ? "opacity-70 pointer-events-none" : ""}>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-bold text-dark-primary flex items-center gap-2">
                        <Tag className="h-5 w-5 text-tecnasa-primary" />
                        Tipos de Entregável
                    </h2>
                    <p className="text-sm text-text-soft mt-0.5">
                        Categorias disponíveis na pasta de entregáveis de cada cliente.
                    </p>
                </div>
                <Button
                    onClick={() => { setShowForm((v) => !v); setError("") }}
                    className="bg-tecnasa-primary text-tecnasa-accent hover:bg-dark-primary transition-colors shadow-md"
                >
                    {showForm
                        ? <><X className="h-4 w-4 mr-2" /> Cancelar</>
                        : <><Plus className="h-4 w-4 mr-2" /> Novo Tipo</>
                    }
                </Button>
            </div>

            {/* Formulário */}
            {showForm && (
                <div className="bg-white border border-tecnasa-primary/30 rounded-xl p-5 mb-6 shadow-sm">
                    <h3 className="text-sm font-bold text-dark-primary mb-4">Novo Tipo de Entregável</h3>
                    <div className="flex gap-3 items-end">
                        <div className="flex flex-col gap-1.5 flex-1">
                            <label className="text-xs font-semibold text-text-soft uppercase tracking-wider">Nome *</label>
                            <input
                                value={form.label}
                                onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))}
                                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                                placeholder="Ex: Relatório Gerencial"
                                autoFocus
                                className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm
                           focus:outline-none focus:ring-2 focus:ring-tecnasa-primary/50 focus:border-tecnasa-primary"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-text-soft uppercase tracking-wider">Cor</label>
                            <select
                                value={form.color}
                                onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))}
                                className="h-9 rounded-md border border-gray-300 px-3 text-sm bg-white
                           focus:outline-none focus:ring-2 focus:ring-tecnasa-primary/50 focus:border-tecnasa-primary"
                            >
                                {COLOR_OPTIONS.map((c) => (
                                    <option key={c.value} value={c.value}>{c.label}</option>
                                ))}
                            </select>
                        </div>
                        <Button
                            onClick={handleAdd}
                            disabled={!form.label.trim()}
                            className="bg-tecnasa-accent text-dark-primary hover:bg-tecnasa-accent/90 font-bold h-9"
                        >
                            <Check className="h-4 w-4 mr-2" /> Salvar
                        </Button>
                    </div>
                    {/* Preview da cor */}
                    {form.label && (
                        <div className="mt-3 flex items-center gap-2">
                            <span className="text-xs text-text-soft">Preview:</span>
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${form.color}`}>
                                {form.label}
                            </span>
                        </div>
                    )}
                    {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
                </div>
            )}

            {/* Lista */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-3 text-left text-[11px] font-semibold text-text-soft uppercase tracking-wider">Tipo</th>
                            <th className="px-6 py-3 text-left text-[11px] font-semibold text-text-soft uppercase tracking-wider">Origem</th>
                            <th className="px-6 py-3 text-center text-[11px] font-semibold text-text-soft uppercase tracking-wider w-16">Ação</th>
                        </tr>
                    </thead>
                    <tbody>
                        {types.map((type, i) => (
                            <tr key={type.id} className={`border-b border-gray-50 hover:bg-gray-50/50 ${i === types.length - 1 ? "border-0" : ""}`}>
                                <td className="px-6 py-4">
                                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${type.color}`}>
                                        {type.label}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    {type.isDefault ? (
                                        <span className="text-xs text-gray-400 flex items-center gap-1">
                                            <Lock className="h-3 w-3" /> Padrão
                                        </span>
                                    ) : (
                                        <span className="text-xs text-tecnasa-primary font-medium">Personalizado</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    {!type.isDefault && (
                                        <button
                                            onClick={() => handleDelete(type.id, type.isDefault)}
                                            className="text-gray-300 hover:text-red-500 transition-colors p-1"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}