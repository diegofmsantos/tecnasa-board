"use client"

import { useTransition, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { disconnectGoogle } from "@/app/actions-google-calendar"
import { Calendar, Check, Link2, Link2Off, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Props {
  googleConnected: boolean
  googleConnectedAt: Date | null
}

export function IntegrationsManager({ googleConnected: initial, googleConnectedAt }: Props) {
  const [connected, setConnected] = useState(initial)
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState("")
  const searchParams = useSearchParams()

  useEffect(() => {
    const success = searchParams.get("success")
    const error = searchParams.get("error")
    if (success === "google") {
      setConnected(true)
      setFeedback("Google Calendar conectado com sucesso!")
    }
    if (error) {
      setFeedback("Erro ao conectar. Tente novamente.")
    }
  }, [searchParams])

  function handleDisconnect() {
    if (!window.confirm("Desconectar o Google Calendar?")) return
    startTransition(async () => {
      await disconnectGoogle()
      setConnected(false)
      setFeedback("Google Calendar desconectado.")
    })
  }

  const connectUrl = "/api/google-calendar/connect"

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-dark-primary flex items-center gap-2">
          <Link2 className="h-5 w-5 text-tecnasa-primary" />
          Integrações
        </h2>
        <p className="text-sm text-text-soft mt-0.5">
          Conecte serviços externos à sua conta.
        </p>
      </div>

      {feedback && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium mb-6 ${feedback.includes("sucesso")
            ? "bg-green-50 border border-green-200 text-green-700"
            : "bg-red-50 border border-red-200 text-red-700"
          }`}>
          {feedback.includes("sucesso") && <Check className="h-4 w-4" />}
          {feedback}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="font-bold text-dark-primary">Google Calendar</p>
              <p className="text-sm text-text-soft mt-0.5">
                {connected
                  ? `Conectado${googleConnectedAt ? " em " + format(new Date(googleConnectedAt), "dd MMM yyyy", { locale: ptBR }) : ""}`
                  : "Sincronize tarefas com prazo diretamente na sua agenda"
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {connected ? (
              <>
                <span className="flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full">
                  <Check className="h-3.5 w-3.5" /> Conectado
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisconnect}
                  disabled={isPending}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  {isPending
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <><Link2Off className="h-4 w-4 mr-2" /> Desconectar</>
                  }
                </Button>
              </>
            ) : (
              <a href={connectUrl}>
                <Button className="bg-tecnasa-primary text-white hover:bg-dark-primary shadow-sm">
                  <Link2 className="h-4 w-4 mr-2" /> Conectar
                </Button>
              </a>
            )}
          </div>
        </div>

        {connected && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-text-soft">
              Acesse a pasta de qualquer cliente → aba <strong>Calendário</strong> → botão <strong>"Sincronizar com Google Agenda"</strong> para exportar as tarefas com prazo para sua agenda.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}