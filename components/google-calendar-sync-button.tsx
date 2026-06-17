"use client"

import { useState } from "react"
import { syncCompanyToGoogleCalendar } from "@/app/actions-google-calendar"
import { CalendarDays, Loader2, Check, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  companyId:   string
  companyName: string
}

export function GoogleCalendarSyncButton({ companyId, companyName }: Props) {
  const [loading,  setLoading]  = useState(false)
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null)

  async function handleSync() {
    setLoading(true)
    setFeedback(null)

    const result = await syncCompanyToGoogleCalendar(companyId)

    if (result.error) {
      setFeedback({ type: "error", msg: result.error })
    } else {
      setFeedback({
        type: "success",
        msg: `${result.synced} tarefa(s) exportada(s) para o Google Calendar!`,
      })
    }
    setLoading(false)

    // Limpa o feedback após 5 segundos
    setTimeout(() => setFeedback(null), 5000)
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button
        onClick={handleSync}
        disabled={loading}
        variant="outline"
        size="sm"
        className="border-blue-300 text-blue-600 hover:bg-blue-50 flex items-center gap-2"
      >
        {loading
          ? <Loader2 className="h-4 w-4 animate-spin" />
          : <CalendarDays className="h-4 w-4" />
        }
        {loading ? "Sincronizando..." : "Sincronizar com Google Agenda"}
      </Button>

      {feedback && (
        <div className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg ${
          feedback.type === "success"
            ? "bg-green-50 border border-green-200 text-green-700"
            : "bg-red-50 border border-red-200 text-red-700"
        }`}>
          {feedback.type === "success"
            ? <Check className="h-3.5 w-3.5" />
            : <AlertCircle className="h-3.5 w-3.5" />
          }
          {feedback.msg}
        </div>
      )}
    </div>
  )
}