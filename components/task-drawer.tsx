"use client"

import { useEffect, useState, useTransition, useRef } from "react"
import { getTaskWithComments, createTaskComment, deleteTaskComment } from "@/app/actions-comments-clerk"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  X, MessageSquare, Send, Trash2, Loader2,
  Calendar, User, Flag, FolderKanban, ExternalLink,
  ChevronRight,
} from "lucide-react"

interface TaskDrawerProps {
  taskId: string | null
  companyId: string
  onClose: () => void
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  TODO:        { label: "Novo",          color: "bg-gray-100 text-gray-700"    },
  IN_PROGRESS: { label: "Em Andamento",  color: "bg-amber-100 text-amber-700"  },
  DONE:        { label: "Concluído",     color: "bg-green-100 text-green-700"  },
}

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  LOW:    { label: "Baixa",  color: "bg-blue-100 text-blue-700"   },
  MEDIUM: { label: "Média",  color: "bg-yellow-100 text-yellow-700" },
  HIGH:   { label: "Alta",   color: "bg-red-100 text-red-700"     },
}

export function TaskDrawer({ taskId, companyId, onClose }: TaskDrawerProps) {
  const [task, setTask] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [comment, setComment] = useState("")
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Carrega a tarefa sempre que o taskId mudar
  useEffect(() => {
    if (!taskId) { setTask(null); return }
    setLoading(true)
    getTaskWithComments(taskId).then((data) => {
      setTask(data)
      setLoading(false)
    })
  }, [taskId])

  // Scroll automático para o último comentário
  useEffect(() => {
    if (task?.comments?.length) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [task?.comments?.length])

  // Fechar com ESC
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [onClose])

  function handleSendComment() {
    if (!comment.trim() || !taskId) return
    const text = comment
    setComment("")

    startTransition(async () => {
      await createTaskComment(taskId, text, companyId)
      // Recarrega os comentários
      const updated = await getTaskWithComments(taskId)
      setTask(updated)
    })
  }

  function handleDeleteComment(commentId: string) {
    if (!taskId) return
    startTransition(async () => {
      await deleteTaskComment(commentId, companyId)
      const updated = await getTaskWithComments(taskId)
      setTask(updated)
    })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Ctrl+Enter ou Cmd+Enter envia
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault()
      handleSendComment()
    }
  }

  const isOpen = !!taskId

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 backdrop-blur-[1px]"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-[480px] bg-white shadow-2xl z-40 flex flex-col
          transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2 text-xs text-text-soft">
            {task && (
              <>
                <span>{task.process?.sector?.name}</span>
                <ChevronRight className="h-3 w-3" />
                <span>{task.process?.title}</span>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Conteúdo */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-tecnasa-primary" />
          </div>
        ) : task ? (
          <div className="flex-1 overflow-y-auto flex flex-col">

            {/* Detalhes da tarefa */}
            <div className="px-6 py-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-dark-primary mb-4 leading-snug">
                {task.title}
              </h2>

              {/* Badges de status e prioridade */}
              <div className="flex flex-wrap gap-2 mb-5">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_CONFIG[task.status]?.color ?? STATUS_CONFIG.TODO.color}`}>
                  {STATUS_CONFIG[task.status]?.label ?? "Novo"}
                </span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${PRIORITY_CONFIG[task.priority]?.color ?? PRIORITY_CONFIG.MEDIUM.color}`}>
                  <Flag className="h-3 w-3" />
                  {PRIORITY_CONFIG[task.priority]?.label ?? "Média"}
                </span>
              </div>

              {/* Grid de metadados */}
              <div className="grid grid-cols-2 gap-4">
                <MetaField
                  icon={User}
                  label="Responsável"
                  value={task.user?.name ?? "Sem responsável"}
                />
                <MetaField
                  icon={Calendar}
                  label="Início"
                  value={task.startDate
                    ? format(new Date(task.startDate), "dd MMM yyyy", { locale: ptBR })
                    : "—"}
                />
                <MetaField
                  icon={Calendar}
                  label="Prazo"
                  value={task.dueDate
                    ? format(new Date(task.dueDate), "dd MMM yyyy", { locale: ptBR })
                    : "—"}
                />
                <MetaField
                  icon={FolderKanban}
                  label="Etapa"
                  value={task.process?.title ?? "—"}
                />
              </div>

              {/* Observações */}
              {task.notes && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-xs font-bold text-text-soft uppercase tracking-wider mb-1">
                    Observações
                  </p>
                  <p className="text-sm text-text-main leading-relaxed">{task.notes}</p>
                </div>
              )}

              {/* Link do Drive */}
              {task.driveLink && (
                <a
                  href={task.driveLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 flex items-center gap-2 text-sm text-tecnasa-primary hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  Abrir arquivo vinculado
                </a>
              )}
            </div>

            {/* Seção de comentários */}
            <div className="flex-1 px-6 py-5 flex flex-col">
              <h3 className="text-sm font-bold text-dark-primary flex items-center gap-2 mb-4">
                <MessageSquare className="h-4 w-4 text-tecnasa-primary" />
                Comentários
                {task.comments?.length > 0 && (
                  <span className="bg-tecnasa-primary/10 text-tecnasa-primary text-xs font-bold px-2 py-0.5 rounded-full">
                    {task.comments.length}
                  </span>
                )}
              </h3>

              {/* Lista de comentários */}
              <div className="flex-1 space-y-3 mb-4">
                {task.comments?.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-text-soft">
                    <MessageSquare className="h-8 w-8 opacity-20 mb-2" />
                    <p className="text-sm italic">Nenhum comentário ainda.</p>
                    <p className="text-xs">Seja o primeiro a comentar.</p>
                  </div>
                ) : (
                  task.comments.map((c: any) => (
                    <div
                      key={c.id}
                      className="group flex gap-3 items-start"
                    >
                      {/* Avatar */}
                      <div className="w-8 h-8 rounded-full bg-tecnasa-primary/10 text-tecnasa-primary flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {c.user?.name ? c.user.name.charAt(0).toUpperCase() : "?"}
                      </div>

                      {/* Balão */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xs font-bold text-dark-primary">
                            {c.user?.name ?? "Usuário"}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-400">
                              {format(new Date(c.createdAt), "dd MMM 'às' HH:mm", { locale: ptBR })}
                            </span>
                            <button
                              onClick={() => handleDeleteComment(c.id)}
                              className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                        <div className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                          <p className="text-sm text-text-main leading-relaxed whitespace-pre-wrap">
                            {c.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={bottomRef} />
              </div>
            </div>
          </div>
        ) : null}

        {/* Input de comentário — fixo no rodapé */}
        {task && (
          <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0 bg-white">
            <div className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Adicionar comentário... (Ctrl+Enter para enviar)"
                rows={2}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm
                           text-text-main placeholder:text-gray-400 resize-none
                           focus:outline-none focus:ring-2 focus:ring-tecnasa-primary/40
                           focus:border-tecnasa-primary"
              />
              <button
                onClick={handleSendComment}
                disabled={!comment.trim() || isPending}
                className="flex-shrink-0 w-9 h-9 rounded-lg bg-tecnasa-primary text-white
                           flex items-center justify-center
                           hover:bg-dark-primary transition-colors
                           disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isPending
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Send className="h-4 w-4" />
                }
              </button>
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5">Ctrl+Enter para enviar</p>
          </div>
        )}
      </div>
    </>
  )
}

function MetaField({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: string
}) {
  return (
    <div>
      <p className="text-[10px] font-bold text-text-soft uppercase tracking-wider mb-1 flex items-center gap-1">
        <Icon className="h-3 w-3" /> {label}
      </p>
      <p className="text-sm font-medium text-dark-primary">{value}</p>
    </div>
  )
}