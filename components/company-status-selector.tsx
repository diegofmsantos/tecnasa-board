"use client"

import { useState, useTransition } from "react"
import { COMPANY_STATUS_CONFIG, COMPANY_STATUS_OPTIONS } from "@/lib/company-status"
import { ChevronDown } from "lucide-react"
import { updateCompanyStatus } from "@/app/actions.company"

interface Props {
  companyId: string
  currentStatus: string
}

export function CompanyStatusSelector({ companyId, currentStatus }: Props) {
  const [status, setStatus] = useState(currentStatus ?? "EM_DIAGNOSTICO")
  const [isPending, startTransition] = useTransition()

  const cfg = COMPANY_STATUS_CONFIG[status] ?? COMPANY_STATUS_CONFIG.EM_DIAGNOSTICO

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value
    setStatus(newStatus)
    startTransition(async () => {
      await updateCompanyStatus(companyId, newStatus)
    })
  }

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[11px] font-bold text-text-soft uppercase tracking-wider">
        Status do Projeto
      </p>
      <div className="relative w-fit">
        <span
          className={`absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`}
        />
        <select
          value={status}
          onChange={handleChange}
          disabled={isPending}
          className={`pl-7 pr-8 py-1.5 text-sm font-bold rounded-full border appearance-none cursor-pointer
                      focus:outline-none focus:ring-2 focus:ring-tecnasa-primary/40
                      disabled:opacity-60 disabled:cursor-wait
                      ${cfg.bg} ${cfg.color}`}
        >
          {COMPANY_STATUS_OPTIONS.map((opt) => (
            <option key={opt.id} value={opt.id} className="bg-white text-gray-800 font-medium">
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className={`absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none ${cfg.color}`} />
      </div>
    </div>
  )
}