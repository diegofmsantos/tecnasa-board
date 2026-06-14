"use client"

import { useState } from "react"
import { FileDown, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export function PdfDownloadButton({ companyId, companyName }: { companyId: string; companyName: string }) {
    const [loading, setLoading] = useState(false)

    async function handleDownload() {
        setLoading(true)
        try {
            const res = await fetch(`/api/company/${companyId}/report`)
            const blob = await res.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `relatorio-${companyName.toLowerCase().replace(/\s+/g, "-")}.pdf`
            a.click()
            URL.revokeObjectURL(url)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button
            onClick={handleDownload}
            disabled={loading}
            variant="outline"
            className="bg-tecnasa-primary text-tecnasa-accent hover:bg-dark-primary transition-colors shadow-md"
        >
            {loading
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Gerando PDF...</>
                : <><FileDown className="h-4 w-4 mr-2" /> Exportar PDF</>
            }
        </Button>
    )
}