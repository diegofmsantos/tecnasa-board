import {
  BarChart3, CheckCircle2,
  CircleDot, Loader2,
} from "lucide-react"

interface Props {
  company: { id: string; name: string }
  metrics: {
    totalTasks: number
    doneCount: number
    inProgressCount: number
    todoCount: number
  }
}

export function CompanyDashboardInline({ company, metrics }: Props) {
  const { totalTasks, doneCount, inProgressCount, todoCount } = metrics

  const donePercentage       = totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0
  const inProgressPercentage = totalTasks > 0 ? Math.round((inProgressCount / totalTasks) * 100) : 0
  const todoPercentage       = totalTasks > 0 ? Math.round((todoCount / totalTasks) * 100) : 0

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2 text-tecnasa-primary mb-1">
          <BarChart3 className="h-4 w-4" />
          <span className="text-sm font-semibold uppercase tracking-wider">
            Relatório de Operação
          </span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-dark-primary">{company.name}</h2>
      </div>

      {/* Mini cards de métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <MetricCard
          label="Total de Demandas"
          value={totalTasks}
          icon={BarChart3}
          colorClass="bg-blue-500/10 text-blue-600"
        />
        <MetricCard
          label="Em Andamento"
          value={inProgressCount}
          icon={Loader2}
          colorClass="bg-amber-500/10 text-amber-600"
        />
        <MetricCard
          label="Concluídas"
          value={doneCount}
          icon={CheckCircle2}
          colorClass="bg-green-500/10 text-green-600"
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm lg:col-span-2">
          <h3 className="text-lg font-bold text-dark-primary mb-6">Status do Projeto</h3>
          <div className="space-y-6">
            <StatusBar
              label="A Fazer"
              icon={<CircleDot className="h-4 w-4 text-gray-400" />}
              count={todoCount}
              percentage={todoPercentage}
              barColor="bg-gray-400"
              textColor="text-text-soft"
            />
            <StatusBar
              label="Em Andamento"
              icon={<Loader2 className="h-4 w-4 text-tecnasa-primary" />}
              count={inProgressCount}
              percentage={inProgressPercentage}
              barColor="bg-tecnasa-primary"
              textColor="text-tecnasa-primary"
            />
            <StatusBar
              label="Concluído"
              icon={<CheckCircle2 className="h-4 w-4 text-green-600" />}
              count={doneCount}
              percentage={donePercentage}
              barColor="bg-green-600"
              textColor="text-green-600"
            />
          </div>
        </div>

        {/* Eficiência global */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between items-center text-center">
          <div className="w-full text-left">
            <h3 className="text-lg font-bold text-dark-primary">Eficiência Global</h3>
            <p className="text-xs text-text-soft mt-1">
              Aproveitamento total das entregas do projeto.
            </p>
          </div>

          <div
            className="my-4 relative flex items-center justify-center w-36 h-36 rounded-full border-8"
            style={{ borderColor: donePercentage > 0 ? "#10B981" : "#E5E7EB" }}
          >
            <div>
              <span className="text-4xl font-extrabold text-dark-primary">{donePercentage}%</span>
              <p className="text-[10px] uppercase tracking-wider text-text-soft font-bold mt-0.5">
                Sucesso
              </p>
            </div>
          </div>

          <p className="text-xs text-text-soft font-medium italic px-2">
            {donePercentage === 100
              ? "🏆 Projeto 100% mapeado e concluído!"
              : donePercentage >= 50
              ? "🚀 A consultoria está fluindo muito bem."
              : "💡 Mova os cards para concluído para aumentar a taxa."}
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function MetricCard({
  label, value, icon: Icon, colorClass,
}: {
  label: string; value: number; icon: React.ElementType; colorClass: string
}) {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-text-soft">{label}</p>
        <h3 className="text-3xl font-bold text-dark-primary mt-1">{value}</h3>
      </div>
      <div className={`p-3 rounded-lg ${colorClass}`}>
        <Icon className="h-6 w-6" />
      </div>
    </div>
  )
}

function StatusBar({
  label, icon, count, percentage, barColor, textColor,
}: {
  label: string; icon: React.ReactNode; count: number
  percentage: number; barColor: string; textColor: string
}) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="font-medium text-text-main flex items-center gap-2">
          {icon} {label}
        </span>
        <span className={`font-bold ${textColor}`}>
          {count} ({percentage}%)
        </span>
      </div>
      <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
        <div
          className={`${barColor} h-full rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}