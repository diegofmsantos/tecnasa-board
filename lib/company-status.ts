export const COMPANY_STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; dot: string }
> = {
  EM_DIAGNOSTICO: {
    label: "Em Diagnóstico",
    color: "text-blue-700",
    bg: "bg-blue-100 border-blue-200",
    dot: "bg-blue-500",
  },
  EM_MAPEAMENTO: {
    label: "Em Mapeamento",
    color: "text-purple-700",
    bg: "bg-purple-100 border-purple-200",
    dot: "bg-purple-500",
  },
  EM_IMPLEMENTACAO: {
    label: "Em Implementação",
    color: "text-amber-700",
    bg: "bg-amber-100 border-amber-200",
    dot: "bg-amber-500",
  },
  EM_MANUTENCAO: {
    label: "Em Manutenção",
    color: "text-orange-700",
    bg: "bg-orange-100 border-orange-200",
    dot: "bg-orange-500",
  },
  CONCLUIDO: {
    label: "Concluído",
    color: "text-green-700",
    bg: "bg-green-100 border-green-200",
    dot: "bg-green-500",
  },
  PAUSADO: {
    label: "Pausado",
    color: "text-gray-600",
    bg: "bg-gray-100 border-gray-200",
    dot: "bg-gray-400",
  },
}

export const COMPANY_STATUS_OPTIONS = Object.entries(COMPANY_STATUS_CONFIG).map(
  ([id, cfg]) => ({ id, label: cfg.label })
)