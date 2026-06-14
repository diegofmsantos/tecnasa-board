"use client"

import { useState, useTransition } from "react"
import { getActivityLogs } from "@/app/actions-activity"
import {
  Activity, Plus, Trash2, RefreshCw,
  MessageSquare, Edit, ToggleLeft, FolderOpen,
  Building2, Filter,
} from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Log {
  id:          string
  action:      string
  entity:      string
  description: string
  companyId:   string | null
  createdAt:   Date
  user:        { id: string; name: string } | null
}

interface Props {
  logs:      Log[]
  companies: { id: string; name: string }[]
  users:     { id: string; name: string }[]
}

const ACTION_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  CREATED:        { icon: Plus,         color: "text-green-600",  bg: "bg-green-50",  label: "Criado"         },
  UPDATED:        { icon: Edit,         color: "text-blue-600",   bg: "bg-blue-50",   label: "Atualizado"     },
  DELETED:        { icon: Trash2,       color: "text-red-500",    bg: "bg-red-50",    label: "Removido"       },
  STATUS_CHANGED: { icon: ToggleLeft,   color: "text-amber-600",  bg: "bg-amber-50",  label: "Status alterado"},
  COMMENTED:      { icon: MessageSquare,color: "text-purple-600", bg: "bg-purple-50", label: "Comentário"     },
}

const ENTITY_LABEL: Record<string, string> = {
  TASK:        "Tarefa",
  PROCESS:     "Etapa",
  SECTOR:      "Setor",
  COMPANY:     "Empresa",
  DELIVERABLE: "Entregável",
  COMMENT:     "Comentário",
}

// Agrupa logs por data
function groupByDate(logs: Log[]) {
  const groups: Record<string, Log[]> = {}
  logs.forEach((log) => {
    const key = format(new Date(log.createdAt), "yyyy-MM-dd")
    if (!groups[key]) groups[key] = []
    groups[key].push(log)
  })
  return groups
}

export function ActivityLogView({ logs: initial, companies, users }: Props) {
  const [logs, setLogs] = useState(initial)
  const [isPending, startTransition] = useTransition()
  const [filters, setFilters] = useState({ companyId: "", userId: "", entity: "" })

  function handleFilter(key: string, value: string) {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)

    startTransition(async () => {
      const result = await getActivityLogs({
        companyId: newFilters.companyId || undefined,
        userId:    newFilters.userId    || undefined,
        entity:    newFilters.entity    || undefined,
        take:      100,
      })
      setLogs(result as Log[])
    })
  }

  const grouped = groupByDate(logs)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-dark-primary flex items-center gap-2">
            <Activity className="h-5 w-5 text-tecnasa-primary" />
            Histórico de Atividades
          </h2>
          <p className="text-sm text-text-soft mt-0.5">
            Registro de todas as ações realizadas na plataforma.
          </p>
        </div>
        {isPending && (
          <RefreshCw className="h-4 w-4 text-tecnasa-primary animate-spin" />
        )}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6 flex flex-wrap gap-3 items-center">
        <Filter className="h-4 w-4 text-text-soft flex-shrink-0" />

        <select
          value={filters.companyId}
          onChange={(e) => handleFilter("companyId", e.target.value)}
          className="h-8 rounded-md border border-gray-200 px-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-tecnasa-primary/40"
        >
          <option value="">Todas as empresas</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select
          value={filters.userId}
          onChange={(e) => handleFilter("userId", e.target.value)}
          className="h-8 rounded-md border border-gray-200 px-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-tecnasa-primary/40"
        >
          <option value="">Todos os usuários</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>

        <select
          value={filters.entity}
          onChange={(e) => handleFilter("entity", e.target.value)}
          className="h-8 rounded-md border border-gray-200 px-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-tecnasa-primary/40"
        >
          <option value="">Todos os tipos</option>
          {Object.entries(ENTITY_LABEL).map(([id, label]) => (
            <option key={id} value={id}>{label}</option>
          ))}
        </select>

        {(filters.companyId || filters.userId || filters.entity) && (
          <button
            onClick={() => {
              setFilters({ companyId: "", userId: "", entity: "" })
              startTransition(async () => {
                const result = await getActivityLogs({ take: 100 })
                setLogs(result as Log[])
              })
            }}
            className="text-xs text-red-500 hover:underline"
          >
            Limpar filtros
          </button>
        )}

        <span className="ml-auto text-xs text-text-soft">{logs.length} registro(s)</span>
      </div>

      {/* Timeline */}
      {logs.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-xl h-[300px] flex flex-col items-center justify-center text-text-soft gap-3">
          <Activity className="h-12 w-12 opacity-20" />
          <p className="text-sm">Nenhuma atividade registrada ainda.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([dateKey, dayLogs]) => (
            <div key={dateKey}>
              {/* Cabeçalho do dia */}
              <div className="flex items-center gap-3 mb-3">
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-xs font-bold text-text-soft uppercase tracking-wider px-2">
                  {format(new Date(dateKey + "T12:00:00"), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                </span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>

              {/* Logs do dia */}
              <div className="space-y-2">
                {dayLogs.map((log) => {
                  const cfg = ACTION_CONFIG[log.action] ?? ACTION_CONFIG.UPDATED
                  const Icon = cfg.icon
                  return (
                    <div
                      key={log.id}
                      className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-start gap-3 hover:shadow-sm transition-shadow"
                    >
                      <div className={`p-1.5 rounded-lg flex-shrink-0 ${cfg.bg}`}>
                        <Icon className={`h-4 w-4 ${cfg.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${cfg.color}`}>
                            {cfg.label}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {ENTITY_LABEL[log.entity] ?? log.entity}
                          </span>
                        </div>
                        <p className="text-sm text-dark-primary mt-0.5">{log.description}</p>
                        <div className="flex items-center gap-3 mt-1">
                          {log.user && (
                            <span className="text-[10px] text-text-soft font-medium">
                              por {log.user.name}
                            </span>
                          )}
                          <span className="text-[10px] text-gray-400">
                            {format(new Date(log.createdAt), "HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}