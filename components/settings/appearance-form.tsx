"use client"

import { useState, useTransition } from "react"
import { saveSettings } from "@/app/actions-settings"
import { Palette, Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
    initialValues: {
        companyName: string
        companyTagline: string
    }
}

export function AppearanceForm({ initialValues }: Props) {
    const [form, setForm] = useState(initialValues)
    const [isPending, startTransition] = useTransition()
    const [saved, setSaved] = useState(false)

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    }

    function handleSave() {
        startTransition(async () => {
            await saveSettings(form)
            setSaved(true)
            setTimeout(() => setSaved(false), 2000)
        })
    }

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-lg font-bold text-dark-primary flex items-center gap-2">
                    <Palette className="h-5 w-5 text-tecnasa-primary" />
                    Personalização
                </h2>
                <p className="text-sm text-text-soft mt-0.5">
                    Ajuste o nome e identidade visual da plataforma.
                </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-text-soft uppercase tracking-wider">
                        Nome da empresa
                    </label>
                    <input
                        name="companyName"
                        value={form.companyName}
                        onChange={handleChange}
                        className="h-9 w-full max-w-sm rounded-md border border-gray-300 px-3 text-sm
                       focus:outline-none focus:ring-2 focus:ring-tecnasa-primary/50 focus:border-tecnasa-primary"
                    />
                    <p className="text-xs text-text-soft">Aparece no sidebar e na página de login.</p>
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-text-soft uppercase tracking-wider">
                        Tagline / Descrição
                    </label>
                    <input
                        name="companyTagline"
                        value={form.companyTagline}
                        onChange={handleChange}
                        className="h-9 w-full max-w-sm rounded-md border border-gray-300 px-3 text-sm
                       focus:outline-none focus:ring-2 focus:ring-tecnasa-primary/50 focus:border-tecnasa-primary"
                    />
                </div>

                <div className="pt-4 border-t border-gray-100">
                    <p className="text-xs font-semibold text-text-soft uppercase tracking-wider mb-3">
                        Cores da Plataforma
                    </p>
                    <div className="flex gap-4 items-center">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-10 h-10 rounded-lg bg-[#484776] shadow-sm border border-gray-200" />
                            <span className="text-[10px] text-text-soft font-medium">Principal</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-10 h-10 rounded-lg bg-[#332f5c] shadow-sm border border-gray-200" />
                            <span className="text-[10px] text-text-soft font-medium">Escuro</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-10 h-10 rounded-lg bg-[#cbff2d] shadow-sm border border-gray-200" />
                            <span className="text-[10px] text-text-soft font-medium">Destaque</span>
                        </div>
                    </div>
                    <p className="text-xs text-text-soft mt-3 italic">
                        Personalização de cores disponível em breve.
                    </p>
                </div>

                <div className="flex justify-end pt-2">
                    <Button
                        onClick={handleSave}
                        disabled={isPending}
                        className="bg-tecnasa-primary text-tecnasa-accent hover:bg-dark-primary transition-colors shadow-md"
                    >
                        {saved
                            ? <><Check className="h-4 w-4 mr-2" /> Salvo!</>
                            : isPending
                                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvando...</>
                                : "Salvar alterações"
                        }
                    </Button>
                </div>
            </div>
        </div>
    )
}