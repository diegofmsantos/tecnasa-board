"use client"

import { useState } from "react"
import { Building2, FolderOpen, Table2, BarChart3 } from "lucide-react"
import { CompanyOverview } from "@/components/company-overview"
import { CompanyDeliverables } from "@/components/company-deliverables"
import { PlannerTable } from "@/components/planner-table"
import { CompanyDashboardInline } from "@/components/company-dashboard-inline"

type Tab = "overview" | "deliverables" | "planning" | "report"

interface CompanyTabsProps {
  company: any
  users: { id: string; name: string }[]
  metrics: {
    totalTasks: number
    doneCount: number
    inProgressCount: number
    todoCount: number
  }
}

const tabs = [
  { id: "overview",      label: "Visão Geral",      icon: Building2   },
  { id: "deliverables",  label: "Entregáveis",       icon: FolderOpen  },
  { id: "planning",      label: "Planejamento",      icon: Table2      },
  { id: "report",        label: "Relatório",         icon: BarChart3   },
] as const

export function CompanyTabs({ company, users, metrics }: CompanyTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("overview")

  return (
    <div>
      {/* Barra de Abas */}
      <div className="flex items-center pb-2 gap-1 border-b border-gray-200 bg-tecnasa-primary mb-8 rounded-xl">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 p-5  text-sm font-medium transition-colors relative whitespace-nowrap ${
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

      {activeTab === "report" && (
        <CompanyDashboardInline
          company={company}
          metrics={metrics}
        />
      )}
    </div>
  )
}