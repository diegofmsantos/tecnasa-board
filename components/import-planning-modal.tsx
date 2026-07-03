// components/import-planning-modal.tsx
"use client"

import { useState, useRef } from "react"
import { Upload, FileSpreadsheet, X, CheckCircle2, AlertCircle, Loader2, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useRouter } from "next/navigation"

interface ImportResult {
    success: boolean
    imported: number
    skipped: number
    errors: string[]
    message: string
    error?: string
}

export function ImportPlanningModal() {
    const [open, setOpen] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<ImportResult | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0]
        if (!f) return
        if (!f.name.endsWith(".xlsx") && !f.name.endsWith(".xls")) {
            alert("Por favor, envie um arquivo .xlsx")
            return
        }
        setFile(f)
        setResult(null)
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault()
        const f = e.dataTransfer.files[0]
        if (!f) return
        setFile(f)
        setResult(null)
    }

    async function handleImport() {
        if (!file) return
        setLoading(true)
        setResult(null)

        try {
            const formData = new FormData()
            formData.append("file", file)

            const res = await fetch("/api/import/planning", {
                method: "POST",
                body: formData,
            })

            const data: ImportResult = await res.json()
            setResult(data)

            if (data.success && data.imported > 0) {
                router.refresh()
            }
        } catch {
            setResult({
                success: false,
                imported: 0,
                skipped: 0,
                errors: [],
                message: "",
                error: "Erro ao conectar com o servidor.",
            })
        } finally {
            setLoading(false)
        }
    }

    function handleClose() {
        setOpen(false)
        setFile(null)
        setResult(null)
    }

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true) }}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    className="flex items-center gap-2 border-dashed bg-tecnasa-primary text-tecnasa-accent hover:bg-dark-primary transition-colors shadow-md"
                >
                    <Upload className="h-4 w-4" />
                    Importar Planejamento
                </Button>
            </DialogTrigger>

            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-dark-primary">
                        <FileSpreadsheet className="h-5 w-5 text-tecnasa-primary" />
                        Importar Planejamento via Planilha
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 mt-2">

                    {/* Download do template */}
                    <div className="flex items-center justify-between bg-indigo-50 rounded-lg px-4 py-3 border border-indigo-100">
                        <div>
                            <p className="text-sm font-medium text-indigo-900">Ainda não tem a planilha modelo?</p>
                            <p className="text-xs text-indigo-600 mt-0.5">Baixe o template e preencha com seus dados</p>
                        </div>
                        <a href="/templates/tecnasa_importacao_planejamento.xlsx" download>
                            <Button size="sm" variant="outline" className="text-indigo-700 border-indigo-300 hover:bg-indigo-100 flex items-center gap-1.5">
                                <Download className="h-3.5 w-3.5" />
                                Baixar Template
                            </Button>
                        </a>
                    </div>

                    {/* Área de upload */}
                    {!result && (
                        <div
                            onDrop={handleDrop}
                            onDragOver={(e) => e.preventDefault()}
                            onClick={() => inputRef.current?.click()}
                            className={`
                relative flex flex-col items-center justify-center gap-3 
                border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all
                ${file
                                    ? "border-green-400 bg-green-50"
                                    : "border-gray-300 bg-gray-50 hover:border-tecnasa-primary hover:bg-indigo-50/40"
                                }
              `}
                        >
                            <input
                                ref={inputRef}
                                type="file"
                                accept=".xlsx,.xls"
                                className="hidden"
                                onChange={handleFileChange}
                            />

                            {file ? (
                                <>
                                    <div className="flex items-center gap-2 text-green-700">
                                        <CheckCircle2 className="h-8 w-8" />
                                    </div>
                                    <div className="text-center">
                                        <p className="font-medium text-green-800">{file.name}</p>
                                        <p className="text-xs text-green-600 mt-0.5">
                                            {(file.size / 1024).toFixed(1)} KB — clique para trocar
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <FileSpreadsheet className="h-10 w-10 text-gray-400" />
                                    <div className="text-center">
                                        <p className="font-medium text-gray-700">Arraste o arquivo aqui</p>
                                        <p className="text-xs text-gray-500 mt-1">ou clique para selecionar • .xlsx</p>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Resultado */}
                    {result && (
                        <div className={`rounded-xl p-4 border ${result.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                            {result.success ? (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-green-800">
                                        <CheckCircle2 className="h-5 w-5" />
                                        <span className="font-semibold">{result.message}</span>
                                    </div>
                                    <div className="flex gap-4 text-sm text-green-700">
                                        <span>✅ {result.imported} importadas</span>
                                        {result.skipped > 0 && <span>⏭ {result.skipped} ignoradas</span>}
                                    </div>
                                    {result.errors.length > 0 && (
                                        <div className="mt-2 space-y-1">
                                            <p className="text-xs font-medium text-amber-800">Avisos:</p>
                                            <ul className="text-xs text-amber-700 space-y-0.5 max-h-32 overflow-y-auto">
                                                {result.errors.map((e, i) => (
                                                    <li key={i}>• {e}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-start gap-2 text-red-800">
                                    <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                    <span className="text-sm">{result.error || result.message}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Rodapé com ações */}
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={handleClose}>
                            {result?.success ? "Fechar" : "Cancelar"}
                        </Button>
                        {!result && (
                            <Button
                                onClick={handleImport}
                                disabled={!file || loading}
                                className="bg-tecnasa-primary text-white hover:bg-dark-primary flex items-center gap-2"
                            >
                                {loading ? (
                                    <><Loader2 className="h-4 w-4 animate-spin" /> Importando...</>
                                ) : (
                                    <><Upload className="h-4 w-4" /> Importar</>
                                )}
                            </Button>
                        )}
                        {result && !result.success && (
                            <Button
                                onClick={() => { setResult(null); setFile(null) }}
                                className="bg-tecnasa-primary text-white hover:bg-dark-primary"
                            >
                                Tentar novamente
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}