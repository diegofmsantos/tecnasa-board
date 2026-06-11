"use client"

import { useState, useTransition } from "react"
import {
  FolderOpen, Plus, ExternalLink, Trash2,
  FileSpreadsheet, Presentation, FileText,
  ScrollText, File, Download, X, Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { createDeliverable, deleteDeliverable } from "@/app/actions.company"

// Configuração visual de cada tipo de entregável
const TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  RECEBIDO:     { label: "Recebido do Cliente", icon: Download,       color: "text-blue-600",   bg: "bg-blue-50 border-blue-200"   },
  DIAGNOSTICO:  { label: "Diagnóstico",          icon: FileText,       color: "text-purple-600", bg: "bg-purple-50 border-purple-200" },
  FLUXOGRAMA:   { label: "Fluxograma",           icon: File,           color: "text-orange-600", bg: "bg-orange-50 border-orange-200" },
  APRESENTACAO: { label: "Apresentação",         icon: Presentation,   color: "text-red-600",    bg: "bg-red-50 border-red-200"     },
  PLANILHA:     { label: "Planilha",             icon: FileSpreadsheet,color: "text-green-600",  bg: "bg-green-50 border-green-200" },
  CONTRATO:     { label: "Contrato",             icon: ScrollText,     color: "text-gray-700",   bg: "bg-gray-50 border-gray-200"   },
  OUTRO:        { label: "Outro",                icon: File,           color: "text-gray-500",   bg: "bg-gray-50 border-gray-200"   },
}

const TYPE_OPTIONS = Object.entries(TYPE_CONFIG).map(([id, cfg]) => ({
  id,
  label: cfg.label,
}))

interface Deliverable {
  id: string
  name: string
  type: string
  url: string
  notes?: string | null
  createdAt: Date
  user?: { name: string } | null
}

interface Props {
  companyId: string
  deliverables: Deliverable[]
}

export function CompanyDeliverables({ companyId, deliverables }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [isPending, startTransition] = useTransition()

  const [form, setForm] = useState({
    name:  "",
    type:  "RECEBIDO",
    url:   "",
    notes: "",
  })

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleAdd() {
    if (!form.name || !form.url) return

    const fd = new FormData()
    fd.set("companyId", companyId)
    fd.set("name",  form.name)
    fd.set("type",  form.type)
    fd.set("url",   form.url)
    fd.set("notes", form.notes)

    startTransition(async () => {
      await createDeliverable(fd)
      setForm({ name: "", type: "RECEBIDO", url: "", notes: "" })
      setShowForm(false)
    })
  }

  function handleDelete(id: string) {
    if (!window.confirm("Remover este entregável?")) return
    startTransition(() => deleteDeliverable(id, companyId))
  }

  // Agrupar por tipo
  const grouped = TYPE_OPTIONS.reduce((acc, { id }) => {
    const items = deliverables.filter((d) => d.type === id)
    if (items.length > 0) acc[id] = items
    return acc
  }, {} as Record<string, Deliverable[]>)

  return (
    <div className={isPending ? "opacity-70 pointer-events-none" : ""}>

      {/* Header da seção */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-dark-primary flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-tecnasa-primary" />
            Pasta de Entregáveis
          </h2>
          <p className="text-sm text-text-soft mt-0.5">
            Centralize aqui todos os documentos e arquivos deste cliente.
          </p>
        </div>

        <Button
          onClick={() => setShowForm((v) => !v)}
          className="bg-tecnasa-primary text-white hover:bg-dark-primary shadow-sm"
        >
          {showForm ? (
            <><X className="h-4 w-4 mr-2" /> Cancelar</>
          ) : (
            <><Plus className="h-4 w-4 mr-2" /> Adicionar Arquivo</>
          )}
        </Button>
      </div>

      {/* Formulário de adição */}
      {showForm && (
        <div className="bg-white border border-tecnasa-primary/30 rounded-xl p-6 mb-6 shadow-sm">
          <h3 className="text-sm font-bold text-dark-primary mb-4">Novo Entregável</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Nome */}
            <div className="lg:col-span-2 flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-soft uppercase tracking-wider">
                Nome do Arquivo *
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Ex: Diagnóstico Comercial v1"
                className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm
                           focus:outline-none focus:ring-2 focus:ring-tecnasa-primary/50 focus:border-tecnasa-primary"
              />
            </div>

            {/* Tipo */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-soft uppercase tracking-wider">
                Tipo
              </label>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className="h-9 w-full rounded-md border border-gray-300 px-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-tecnasa-primary/50 focus:border-tecnasa-primary bg-white"
              >
                {TYPE_OPTIONS.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* Link */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-soft uppercase tracking-wider">
                Link (Google Drive, etc.) *
              </label>
              <input
                name="url"
                value={form.url}
                onChange={handleChange}
                placeholder="https://drive.google.com/..."
                type="url"
                className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm
                           focus:outline-none focus:ring-2 focus:ring-tecnasa-primary/50 focus:border-tecnasa-primary"
              />
            </div>

            {/* Observação */}
            <div className="sm:col-span-2 lg:col-span-3 flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-soft uppercase tracking-wider">
                Observação (opcional)
              </label>
              <input
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Ex: Versão aprovada em reunião de 10/06"
                className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm
                           focus:outline-none focus:ring-2 focus:ring-tecnasa-primary/50 focus:border-tecnasa-primary"
              />
            </div>

            <div className="flex items-end">
              <Button
                onClick={handleAdd}
                disabled={!form.name || !form.url}
                className="w-full bg-tecnasa-accent text-dark-primary hover:bg-tecnasa-accent/90 font-bold h-9"
              >
                <Check className="h-4 w-4 mr-2" /> Salvar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Estado vazio */}
      {deliverables.length === 0 && !showForm && (
        <div className="border-2 border-dashed border-gray-200 rounded-xl h-[300px] flex flex-col items-center justify-center text-text-soft gap-3">
          <FolderOpen className="h-12 w-12 opacity-30" />
          <div className="text-center">
            <p className="font-medium">Pasta vazia</p>
            <p className="text-sm">Clique em "Adicionar Arquivo" para começar.</p>
          </div>
        </div>
      )}

      {/* Lista agrupada por tipo */}
      {Object.entries(grouped).map(([type, items]) => {
        const cfg = TYPE_CONFIG[type] ?? TYPE_CONFIG.OUTRO
        const Icon = cfg.icon

        return (
          <div key={type} className="mb-6">
            {/* Cabeçalho do grupo */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border mb-3 w-fit ${cfg.bg}`}>
              <Icon className={`h-4 w-4 ${cfg.color}`} />
              <span className={`text-xs font-bold uppercase tracking-wider ${cfg.color}`}>
                {cfg.label}
              </span>
              <span className={`text-[10px] font-black ${cfg.color} opacity-60`}>
                ({items.length})
              </span>
            </div>

            {/* Cards dos arquivos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((d) => (
                <DeliverableCard
                  key={d.id}
                  deliverable={d}
                  config={cfg}
                  onDelete={() => handleDelete(d.id)}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Card de cada entregável ──────────────────────────────────────────────────

function DeliverableCard({
  deliverable: d,
  config: cfg,
  onDelete,
}: {
  deliverable: Deliverable
  config: { icon: React.ElementType; color: string; bg: string; label: string }
  onDelete: () => void
}) {
  const Icon = cfg.icon

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow group flex flex-col gap-3">
      {/* Topo: ícone + nome + botão externo */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`p-2 rounded-lg flex-shrink-0 border ${cfg.bg}`}>
            <Icon className={`h-4 w-4 ${cfg.color}`} />
          </div>
          <p className="text-sm font-bold text-dark-primary leading-tight line-clamp-2">
            {d.name}
          </p>
        </div>

        <a
          href={d.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 p-1.5 rounded-md text-gray-400 hover:text-tecnasa-primary hover:bg-tecnasa-primary/5 transition-colors"
          title="Abrir arquivo"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      {/* Observação */}
      {d.notes && (
        <p className="text-xs text-text-soft leading-relaxed line-clamp-2">{d.notes}</p>
      )}

      {/* Rodapé: data + quem adicionou + excluir */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-50 mt-auto">
        <div className="text-[10px] text-gray-400">
          <span>{format(new Date(d.createdAt), "dd MMM yyyy", { locale: ptBR })}</span>
          {d.user?.name && (
            <span className="ml-1.5">· {d.user.name}</span>
          )}
        </div>
        <button
          onClick={onDelete}
          className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1"
          title="Remover"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}