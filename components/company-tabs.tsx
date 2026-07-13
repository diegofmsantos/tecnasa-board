"use client"

import { useState } from "react"
import { Building2, FolderOpen, Table2, BarChart3, CalendarDays, Brain } from "lucide-react"
import { CompanyOverview } from "@/components/company-overview"
import { CompanyDeliverables } from "@/components/company-deliverables"
import { PlannerTable } from "@/components/planner-table"
import { CompanyDashboardInline } from "@/components/company-dashboard-inline"
import { TaskCalendar } from "@/components/task-calendar"
import { DiagnosticTab } from "@/components/diagnostic-tab"
import type { CompanyWithPlanner, TranscriptWithRelations, DiagnosticSessionWithRelations } from "@/types/company"

type Tab = "overview" | "deliverables" | "planning" | "calendar" | "report" | "diagnostic"

interface CompanyTabsProps {
  company: CompanyWithPlanner
  users: { id: string; name: string }[]
  metrics: {
    totalTasks:      number
    doneCount:       number
    inProgressCount: number
    todoCount:       number
  }
  transcripts:        TranscriptWithRelations[]
  diagnosticSessions: DiagnosticSessionWithRelations[]
  apiEnabled:         boolean
}

const tabs = [
  { id: "overview",    label: "Visão Geral",    icon: Building2    },
  { id: "deliverables",label: "Entregáveis",    icon: FolderOpen   },
  { id: "planning",    label: "Planejamento",   icon: Table2       },
  { id: "calendar",    label: "Calendário",     icon: CalendarDays },
  { id: "report",      label: "Relatório",      icon: BarChart3    },
  { id: "diagnostic",  label: "Diagnóstico IA", icon: Brain        },
] as const

export function CompanyTabs({
  company, users, metrics,
  transcripts, diagnosticSessions, apiEnabled,
}: CompanyTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("overview")

  const sectors = company.sectors?.map((s) => ({ id: s.id, name: s.name })) ?? []

  return (
    <div>
      {/* Barra de Abas */}
      <div className="flex items-center pb-2 gap-1 border-b border-gray-200 bg-dark-primary mb-8 rounded-xl overflow-x-auto">
        {tabs.map((tab) => {
          const Icon     = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 p-5 text-sm font-medium transition-colors relative whitespace-nowrap flex-shrink-0 ${
                isActive
                  ? "text-tecnasa-accent"
                  : "text-white hover:text-tecnasa-accent"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              {isActive && (
                <span className="absolute bottom-3 left-2 w-full h-[2px] bg-tecnasa-accent rounded-t-full" />
              )}
            </button>
          )
        })}
      </div>

      {/* Conteúdo de cada Aba */}
      {activeTab === "overview" && (
        <CompanyOverview company={company} />
      )}

      {activeTab === "deliverables" && (
        <CompanyDeliverables
          companyId={company.id}
          deliverables={company.deliverables}
        />
      )}

      {activeTab === "planning" && (
        <PlannerTable
          sectors={company.sectors}
          companyId={company.id}
          users={users}
        />
      )}

      {activeTab === "calendar" && (
        <TaskCalendar
          companyId={company.id}
          sectors={company.sectors}
        />
      )}

      {activeTab === "report" && (
        <CompanyDashboardInline
          company={company}
          metrics={metrics}
        />
      )}

      {activeTab === "diagnostic" && (
        <DiagnosticTab
          companyId={company.id}
          companyName={company.name}
          sectors={sectors}
          initialTranscripts={transcripts}
          initialSessions={diagnosticSessions}
          apiEnabled={apiEnabled}
        />
      )}
    </div>
  )
}