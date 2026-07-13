"use client"

import { useEffect, useState } from "react"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import interactionPlugin from "@fullcalendar/interaction"
import ptBrLocale from "@fullcalendar/core/locales/pt-br"
import { GoogleCalendarSyncButton } from "@/components/google-calendar-sync-button"

interface RawTask {
  id:       string
  title:    string
  status:   string
  dueDate?: Date | string | null
  startDate?: Date | string | null
  user?: { name: string } | null
}

// RawTask enriquecido com a etapa/setor de origem, montado ao gerar os eventos do calendário
interface Task extends RawTask {
  process: {
    title: string
    sector: { name: string }
  }
}

interface Props {
  companyId: string
  sectors: Array<{
    id:   string
    name: string
    processes: Array<{
      id:    string
      title: string
      tasks: RawTask[]
    }>
  }>
}

const STATUS_COLOR: Record<string, string> = {
  TODO:        "#9ca3af",
  IN_PROGRESS: "#f59e0b",
  DONE:        "#10b981",
}

const STATUS_LABEL: Record<string, string> = {
  TODO:        "Novo",
  IN_PROGRESS: "Em Andamento",
  DONE:        "Concluído",
}

export function TaskCalendar({ companyId, sectors }: Props) {
  const [mounted, setMounted] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  useEffect(() => { setMounted(true) }, [])

  // Converte tarefas em eventos do FullCalendar
  const events = sectors.flatMap((sector) =>
    sector.processes.flatMap((process) =>
      process.tasks
        .filter((task) => task.dueDate || task.startDate)
        .map((task) => {
          const taskWithProcess: Task = {
            ...task,
            process: { title: process.title, sector: { name: sector.name } },
          }
          return {
            id:               task.id,
            title:            task.title,
            start:            task.startDate
                                ? new Date(task.startDate).toISOString().split("T")[0]
                                : new Date(task.dueDate!).toISOString().split("T")[0],
            end:              task.dueDate
                                ? new Date(task.dueDate).toISOString().split("T")[0]
                                : undefined,
            backgroundColor:  STATUS_COLOR[task.status] ?? "#9ca3af",
            borderColor:      STATUS_COLOR[task.status] ?? "#9ca3af",
            textColor:        "#fff",
            extendedProps:    { task: taskWithProcess, sector: sector.name },
          }
        })
    )
  )

  if (!mounted) {
    return (
      <div className="h-[600px] bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-center">
        <p className="text-text-soft text-sm">Carregando calendário...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header com botão de sincronizar */}
      <div className="flex justify-end">
        <GoogleCalendarSyncButton companyId={companyId} />
      </div>

      <div className="flex gap-6">
      {/* Calendário */}
      <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm p-4 min-w-0">
        <style>{`
          .fc .fc-toolbar-title { font-size: 1rem; font-weight: 700; color: #332f5c; }
          .fc .fc-button-primary { background-color: #484776 !important; border-color: #484776 !important; font-size: 0.75rem; }
          .fc .fc-button-primary:hover { background-color: #332f5c !important; border-color: #332f5c !important; }
          .fc .fc-button-primary:not(:disabled).fc-button-active { background-color: #332f5c !important; }
          .fc .fc-col-header-cell { background-color: #f9fafb; }
          .fc .fc-col-header-cell-cushion { font-size: 0.75rem; font-weight: 600; color: #6b6b8a; text-decoration: none; padding: 8px 4px; }
          .fc .fc-daygrid-day-number { font-size: 0.75rem; color: #374151; text-decoration: none; }
          .fc .fc-day-today { background-color: #484776/5 !important; }
          .fc .fc-day-today .fc-daygrid-day-number { color: #484776; font-weight: 700; }
          .fc .fc-event { cursor: pointer; font-size: 0.7rem; padding: 1px 3px; border-radius: 4px; }
          .fc .fc-event-title { font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .fc .fc-daygrid-more-link { font-size: 0.65rem; color: #484776; font-weight: 600; }
          .fc-theme-standard td, .fc-theme-standard th { border-color: #f3f4f6; }
          .fc-theme-standard .fc-scrollgrid { border-color: #e5e7eb; }
        `}</style>

        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale={ptBrLocale}
          events={events}
          dayMaxEvents={3}
          headerToolbar={{
            left:   "prev,next today",
            center: "title",
            right:  "dayGridMonth,dayGridWeek",
          }}
          eventClick={(info) => {
            const task = info.event.extendedProps.task as Task
            setSelectedTask(task)
          }}
          height={580}
        />
      </div>

      {/* Painel lateral de detalhes */}
      <div className="w-72 flex-shrink-0 space-y-4">
        {/* Legenda */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <p className="text-xs font-bold text-text-soft uppercase tracking-wider mb-3">Legenda</p>
          <div className="space-y-2">
            {Object.entries(STATUS_LABEL).map(([key, label]) => (
              <div key={key} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: STATUS_COLOR[key] }} />
                <span className="text-xs text-text-main">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Detalhes da tarefa selecionada */}
        {selectedTask ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-start justify-between gap-2 mb-3">
              <p className="text-xs font-bold text-text-soft uppercase tracking-wider">Tarefa selecionada</p>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-gray-400 hover:text-gray-600 text-xs"
              >✕</button>
            </div>

            <p className="font-bold text-dark-primary text-sm mb-3 leading-snug">
              {selectedTask.title}
            </p>

            <div className="space-y-2">
              <div>
                <p className="text-[10px] font-bold text-text-soft uppercase tracking-wider">Status</p>
                <span
                  className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full text-white mt-0.5"
                  style={{ backgroundColor: STATUS_COLOR[selectedTask.status] }}
                >
                  {STATUS_LABEL[selectedTask.status]}
                </span>
              </div>

              <div>
                <p className="text-[10px] font-bold text-text-soft uppercase tracking-wider">Etapa</p>
                <p className="text-xs text-dark-primary mt-0.5">
                  {selectedTask.process.sector.name} / {selectedTask.process.title}
                </p>
              </div>

              {selectedTask.user && (
                <div>
                  <p className="text-[10px] font-bold text-text-soft uppercase tracking-wider">Responsável</p>
                  <p className="text-xs text-dark-primary mt-0.5">{selectedTask.user.name}</p>
                </div>
              )}

              {selectedTask.startDate && (
                <div>
                  <p className="text-[10px] font-bold text-text-soft uppercase tracking-wider">Início</p>
                  <p className="text-xs text-dark-primary mt-0.5">
                    {new Date(selectedTask.startDate).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              )}

              {selectedTask.dueDate && (
                <div>
                  <p className="text-[10px] font-bold text-text-soft uppercase tracking-wider">Prazo</p>
                  <p className="text-xs text-dark-primary mt-0.5">
                    {new Date(selectedTask.dueDate).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <p className="text-xs font-bold text-text-soft uppercase tracking-wider mb-2">Detalhes</p>
            <p className="text-xs text-text-soft italic">
              Clique em uma tarefa no calendário para ver os detalhes.
            </p>
          </div>
        )}

        {/* Resumo do mês */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <p className="text-xs font-bold text-text-soft uppercase tracking-wider mb-3">Total de Atividades</p>
          <div className="space-y-2">
            {Object.entries(STATUS_LABEL).map(([key, label]) => {
              const allTasks = sectors.flatMap(s => s.processes.flatMap(p => p.tasks))
              const count = allTasks.filter(t => t.status === key).length
              return (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-xs text-text-soft">{label}</span>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: STATUS_COLOR[key] }}
                  >
                    {count}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
    </div>
  )
}