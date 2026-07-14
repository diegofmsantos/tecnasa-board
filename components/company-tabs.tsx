"use client"

import { useState } from "react"
import { Building2, FolderOpen, Table2, BarChart3, CalendarDays, ClipboardList } from "lucide-react"
import { CompanyOverview } from "@/components/company-overview"
import { CompanyDeliverables } from "@/components/company-deliverables"
import { PlannerTable } from "@/components/planner-table"
import { CompanyDashboardInline } from "@/components/company-dashboard-inline"
import { TaskCalendar } from "@/components/task-calendar"
import { PdcaMeetingsPanel } from "@/components/pdca-meetings-panel"
import type { CompanyWithPlanner } from "@/types/company"

type Tab = "overview" | "deliverables" | "planning" | "calendar" | "report" | "pdca"

interface PdcaMeeting {
  id: string
  date: Date
  etapaPdca: string
  avancos: string | null
  observacoes: string | null
  decisoes: string | null
  proximosPassos: string | null
  user?: { name: string } | null
}

interface CompanyTabsProps {
  company: CompanyWithPlanner
  users: { id: string; name: string }[]
  metrics: {
    totalTasks: number
    doneCount: number
    inProgressCount: number
    todoCount: number
  }
  pdcaMeetings: PdcaMeeting[]
}

const tabs = [
  { id: "overview", label: "Visão Geral", icon: Building2 },
  { id: "deliverables", label: "Entregáveis", icon: FolderOpen },
  { id: "planning", label: "Planejamento", icon: Table2 },
  { id: "calendar", label: "Calendário", icon: CalendarDays },
  { id: "report", label: "Relatório", icon: BarChart3 },
  { id: "pdca", label: "PDCA", icon: ClipboardList },
] as const

export function CompanyTabs({
  company, users, metrics, pdcaMeetings,
}: CompanyTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("overview")

  return (
    <div>
      {/* Barra de Abas */}
      <div className="flex items-center pb-2 gap-1 border-b border-gray-200 bg-dark-primary mb-8 rounded-xl overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`flex items-center gap-2 p-5 text-sm font-medium transition-colors relative whitespace-nowrap flex-shrink-0 ${isActive
                  ? "text-tecnasa-accent"
                  : "text-white hover:text-tecnasa-accent"
                }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              {tab.id === "pdca" && pdcaMeetings.length > 0 && (
                <span className="bg-tecnasa-accent/20 text-tecnasa-accent text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {pdcaMeetings.length}
                </span>
              )}
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

      {activeTab === "pdca" && (
        <PdcaMeetingsPanel
          companyId={company.id}
          meetings={pdcaMeetings}
        />
      )}
    </div>
  )
}