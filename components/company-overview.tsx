"use client"

import { useState, useTransition } from "react"
import {
  Building2, Phone, Mail, Globe, MapPin,
  Briefcase, FileText, Pencil, Check, X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { updateCompanyInfo } from "@/app/actions.company-clerk"
import { CompanyStatusSelector } from "./company-status-selector"
import type { CompanyStatus } from "@prisma/client"

interface Company {
  id: string
  name: string
  logoUrl?: string | null
  cnpj?: string | null
  segment?: string | null
  contactName?: string | null
  contactEmail?: string | null
  contactPhone?: string | null
  address?: string | null
  website?: string | null
  notes?: string | null
  status: CompanyStatus
}

export function CompanyOverview({ company }: { company: Company }) {
  const [isEditing, setIsEditing] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Estado local do formulário
  const [form, setForm] = useState({
    name: company.name ?? "",
    logoUrl: company.logoUrl ?? "",
    cnpj: company.cnpj ?? "",
    segment: company.segment ?? "",
    contactName: company.contactName ?? "",
    contactEmail: company.contactEmail ?? "",
    contactPhone: company.contactPhone ?? "",
    address: company.address ?? "",
    website: company.website ?? "",
    notes: company.notes ?? "",
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleSave() {
    const formData = new FormData()
    formData.set("companyId", company.id)
    Object.entries(form).forEach(([k, v]) => formData.set(k, v))

    startTransition(async () => {
      await updateCompanyInfo(formData)
      setIsEditing(false)
    })
  }

  function handleCancel() {
    // Volta ao valor atual sem salvar
    setForm({
      name: company.name ?? "",
      logoUrl: company.logoUrl ?? "",
      cnpj: company.cnpj ?? "",
      segment: company.segment ?? "",
      contactName: company.contactName ?? "",
      contactEmail: company.contactEmail ?? "",
      contactPhone: company.contactPhone ?? "",
      address: company.address ?? "",
      website: company.website ?? "",
      notes: company.notes ?? "",
    })
    setIsEditing(false)
  }

  if (!isEditing) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Card principal de dados */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-bold text-dark-primary">Dados da Empresa</h2>
              <CompanyStatusSelector
                companyId={company.id}
                currentStatus={company.status}
              />
            </div>
            <Button
              size="sm"
              onClick={() => setIsEditing(true)}
              className="bg-tecnasa-primary text-tecnasa-accent hover:bg-dark-primary transition-colors shadow-md"
            >
              <Pencil className="h-4 w-4 mr-2" /> Editar
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <InfoField icon={Building2} label="Razão Social" value={form.name} />
            <InfoField icon={FileText} label="CNPJ" value={form.cnpj} />
            <InfoField icon={Briefcase} label="Segmento" value={form.segment} />
            <InfoField icon={Globe} label="Website" value={form.website} isLink />
            <InfoField icon={MapPin} label="Endereço" value={form.address} className="sm:col-span-2" />
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <h3 className="text-sm font-bold text-text-soft uppercase tracking-wider mb-4">
              Contato Principal
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <InfoField icon={Building2} label="Nome" value={form.contactName} />
              <InfoField icon={Mail} label="E-mail" value={form.contactEmail} isLink linkPrefix="mailto:" />
              <InfoField icon={Phone} label="Telefone" value={form.contactPhone} isLink linkPrefix="tel:" />
            </div>
          </div>
        </div>

        {/* Card de Observações */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-dark-primary">Observações do Projeto</h2>
          </div>
          {form.notes ? (
            <p className="text-sm text-text-main leading-relaxed whitespace-pre-wrap flex-1">
              {form.notes}
            </p>
          ) : (
            <div className="flex-1 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
              <p className="text-text-soft text-sm italic text-center px-4">
                Nenhuma observação. Clique em Editar para adicionar.
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ─── MODO EDIÇÃO ─────────────────────────────────────────────────────────────
  return (
    <div className="bg-white rounded-xl border border-tecnasa-primary/30 shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-dark-primary">Editando Dados da Empresa</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCancel} disabled={isPending}>
            <X className="h-4 w-4 mr-2" /> Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isPending}
            className="bg-tecnasa-primary text-white hover:bg-dark-primary"
          >
            <Check className="h-4 w-4 mr-2" />
            {isPending ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <EditField label="Razão Social *" name="name" value={form.name} onChange={handleChange} />
        <EditField label="URL da Logo" name="logoUrl" value={form.logoUrl} onChange={handleChange} placeholder="https://..." />
        <EditField label="CNPJ" name="cnpj" value={form.cnpj} onChange={handleChange} placeholder="00.000.000/0000-00" />
        <EditField label="Segmento" name="segment" value={form.segment} onChange={handleChange} placeholder="Ex: Saúde, Varejo..." />
        <EditField label="Website" name="website" value={form.website} onChange={handleChange} placeholder="https://..." />
        <EditField label="Endereço" name="address" value={form.address} onChange={handleChange} className="sm:col-span-2 lg:col-span-2" />

        <div className="sm:col-span-2 lg:col-span-3">
          <p className="text-xs font-bold text-text-soft uppercase tracking-wider mb-3 mt-2">
            Contato Principal
          </p>
        </div>

        <EditField label="Nome do Contato" name="contactName" value={form.contactName} onChange={handleChange} />
        <EditField label="E-mail" name="contactEmail" value={form.contactEmail} onChange={handleChange} type="email" />
        <EditField label="Telefone" name="contactPhone" value={form.contactPhone} onChange={handleChange} placeholder="(81) 99999-9999" />

        {/* Observações ocupa linha inteira */}
        <div className="sm:col-span-2 lg:col-span-3 flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text-soft uppercase tracking-wider">
            Observações do Projeto
          </label>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows={5}
            placeholder="Anotações gerais, contexto do projeto, particularidades do cliente..."
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-text-main
                       focus:outline-none focus:ring-2 focus:ring-tecnasa-primary/50
                       focus:border-tecnasa-primary resize-none"
          />
        </div>
      </div>
    </div>
  )
}

// ─── Sub-componentes de apoio ────────────────────────────────────────────────

function InfoField({
  icon: Icon,
  label,
  value,
  isLink,
  linkPrefix,
  className,
}: {
  icon: React.ElementType
  label: string
  value?: string | null
  isLink?: boolean
  linkPrefix?: string
  className?: string
}) {
  return (
    <div className={className}>
      <p className="text-[11px] font-bold text-text-soft uppercase tracking-wider mb-1 flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5" /> {label}
      </p>
      {value ? (
        isLink ? (
          <a
            href={`${linkPrefix ?? ""}${value}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-tecnasa-primary hover:underline"
          >
            {value}
          </a>
        ) : (
          <p className="text-sm font-medium text-dark-primary">{value}</p>
        )
      ) : (
        <p className="text-sm text-gray-300 italic">Não informado</p>
      )}
    </div>
  )
}

function EditField({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder,
  className,
}: {
  label: string
  name: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  type?: string
  placeholder?: string
  className?: string
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <label
        htmlFor={name}
        className="text-xs font-semibold text-text-soft uppercase tracking-wider"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="h-9 w-full rounded-md border border-gray-300 px-3 py-1 text-sm
                   text-text-main placeholder:text-gray-300
                   focus:outline-none focus:ring-2 focus:ring-tecnasa-primary/50
                   focus:border-tecnasa-primary"
      />
    </div>
  )
}