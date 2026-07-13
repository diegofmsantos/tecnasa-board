"use client"

import { useState, useTransition } from "react"
import { createClientUser, deleteClientUser, updateClientCompany, updateClientUser } from "@/app/actions-clients"
import {
  Users, Plus, Trash2, X, Check, Loader2,
  Building2, Mail, Eye, EyeOff, RefreshCw, Pencil,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface ClientUser {
  id: string
  clerkId: string
  name: string
  email: string
  createdAt: Date
  company: { id: string; name: string }
}

interface Company {
  id: string
  name: string
}

interface Props {
  clientUsers: ClientUser[]
  companies: Company[]
}

// Gera uma senha temporária segura
function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!"
  return Array.from({ length: 12 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("")
}

export function ClientsManager({ clientUsers: initial, companies }: Props) {
  const [clients, setClients] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: "", email: "" })

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: generatePassword(),
    companyId: companies[0]?.id ?? "",
  })

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleCreate() {
    setError("")
    if (!form.name || !form.email || !form.password || !form.companyId) {
      setError("Preencha todos os campos.")
      return
    }

    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => fd.set(k, v))

    startTransition(async () => {
      const result = await createClientUser(fd)
      if ("error" in result) {
        setError(result.error)
        return
      }
      // Adiciona o novo cliente na lista local
      setClients((prev) => [
        {
          id: crypto.randomUUID(),
          clerkId: "",
          name: form.name,
          email: form.email,
          createdAt: new Date(),
          company: companies.find((c) => c.id === form.companyId)!,
        },
        ...prev,
      ])
      setForm({ name: "", email: "", password: generatePassword(), companyId: companies[0]?.id ?? "" })
      setShowForm(false)
    })
  }

  function handleDelete(clientId: string, clerkId: string, name: string) {
    if (!window.confirm(`Remover acesso de "${name}"? Ele não conseguirá mais entrar no portal.`)) return
    startTransition(async () => {
      await deleteClientUser(clientId, clerkId)
      setClients((prev) => prev.filter((c) => c.id !== clientId))
    })
  }

  function handleCompanyChange(clientId: string, companyId: string) {
    startTransition(async () => {
      await updateClientCompany(clientId, companyId)
      setClients((prev) =>
        prev.map((c) =>
          c.id === clientId
            ? { ...c, company: companies.find((co) => co.id === companyId)! }
            : c
        )
      )
    })
  }

  function handleEdit(client: ClientUser) {
    setEditingId(client.id)
    setEditForm({ name: client.name, email: client.email })
    setError("")
  }

  function handleSaveEdit(client: ClientUser) {
    setError("")
    startTransition(async () => {
      const result = await updateClientUser(client.id, client.clerkId, editForm.name, editForm.email)
      if ("error" in result) { setError(result.error); return }
      setClients((prev) =>
        prev.map((c) =>
          c.id === client.id ? { ...c, name: editForm.name, email: editForm.email } : c
        )
      )
      setEditingId(null)
    })
  }

  return (
    <div className={isPending ? "opacity-70 pointer-events-none" : ""}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-dark-primary flex items-center gap-2">
            <Users className="h-5 w-5 text-tecnasa-primary" />
            Clientes do Portal
          </h2>
          <p className="text-sm text-text-soft mt-0.5">
            Gerencie quem tem acesso ao portal do cliente.
          </p>
        </div>
        <Button
          onClick={() => { setShowForm((v) => !v); setError("") }}
          className="bg-tecnasa-primary text-tecnasa-accent hover:bg-dark-primary transition-colors shadow-md"
        >
          {showForm
            ? <><X className="h-4 w-4 mr-2" /> Cancelar</>
            : <><Plus className="h-4 w-4 mr-2" /> Novo Acesso</>
          }
        </Button>
      </div>

      {/* Formulário de criação */}
      {showForm && (
        <div className="bg-white border border-tecnasa-primary/30 rounded-xl p-6 mb-6 shadow-sm">
          <h3 className="text-sm font-bold text-dark-primary mb-4">Criar Acesso ao Portal</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Nome completo *" name="name" value={form.name} onChange={handleChange} placeholder="Nome do cliente" />
            <FormField label="E-mail *" name="email" type="email" value={form.email} onChange={handleChange} placeholder="cliente@empresa.com" />

            {/* Senha com toggle de visibilidade e gerador */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-soft uppercase tracking-wider">
                Senha temporária *
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={handleChange}
                    className="h-9 w-full rounded-md border border-gray-300 px-3 pr-9 text-sm
                               focus:outline-none focus:ring-2 focus:ring-tecnasa-primary/50 focus:border-tecnasa-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, password: generatePassword() }))}
                  title="Gerar nova senha"
                  className="h-9 w-9 flex items-center justify-center rounded-md border border-gray-300 text-gray-500 hover:text-tecnasa-primary hover:border-tecnasa-primary transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
              <p className="text-[10px] text-text-soft">Anote esta senha para enviar ao cliente.</p>
            </div>

            {/* Empresa vinculada */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-soft uppercase tracking-wider">
                Empresa vinculada *
              </label>
              <select
                name="companyId"
                value={form.companyId}
                onChange={handleChange}
                className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm bg-white
                           focus:outline-none focus:ring-2 focus:ring-tecnasa-primary/50 focus:border-tecnasa-primary"
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 font-medium mt-3">{error}</p>
          )}

          <div className="flex justify-end mt-4">
            <Button
              onClick={handleCreate}
              disabled={isPending}
              className="bg-tecnasa-accent text-dark-primary hover:bg-tecnasa-accent/90 font-bold"
            >
              {isPending
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Criando...</>
                : <><Check className="h-4 w-4 mr-2" /> Criar Acesso</>
              }
            </Button>
          </div>
        </div>
      )}

      {/* Lista de clientes */}
      {clients.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-xl h-[300px] flex flex-col items-center justify-center text-text-soft gap-3">
          <Users className="h-12 w-12 opacity-20" />
          <div className="text-center">
            <p className="font-medium">Nenhum cliente com acesso ao portal.</p>
            <p className="text-sm">Clique em "Novo Acesso" para criar o primeiro.</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-[11px] font-semibold text-text-soft uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold text-text-soft uppercase tracking-wider">Empresa vinculada</th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold text-text-soft uppercase tracking-wider">Desde</th>
                <th className="px-6 py-3 text-center text-[11px] font-semibold text-text-soft uppercase tracking-wider w-16">Ação</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client, i) => (
                <tr
                  key={client.id}
                  className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${i === clients.length - 1 ? "border-0" : ""}`}
                >
                  {/* Nome e e-mail */}
                  <td className="px-6 py-4">
                    {editingId === client.id ? (
                      <div className="flex flex-col gap-2">
                        <input
                          value={editForm.name}
                          onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                          className="h-8 w-full rounded border border-gray-300 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-tecnasa-primary/50"
                          placeholder="Nome"
                        />
                        <input
                          value={editForm.email}
                          onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                          className="h-8 w-full rounded border border-gray-300 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-tecnasa-primary/50"
                          placeholder="E-mail"
                          type="email"
                        />
                        {error && <p className="text-xs text-red-600">{error}</p>}
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-tecnasa-primary/10 text-tecnasa-primary flex items-center justify-center font-bold text-sm flex-shrink-0">
                          {client.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-dark-primary">{client.name}</p>
                          <p className="text-xs text-text-soft flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {client.email}
                          </p>
                        </div>
                      </div>
                    )}
                  </td>

                  {/* Empresa */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-text-soft flex-shrink-0" />
                      <select
                        defaultValue={client.company.id}
                        onChange={(e) => handleCompanyChange(client.id, e.target.value)}
                        className="text-sm font-medium text-dark-primary bg-transparent border-b border-transparent
                                     hover:border-gray-300 focus:border-tecnasa-primary focus:outline-none py-0.5"
                      >
                        {companies.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </td>

                  {/* Data */}
                  <td className="px-6 py-4 text-text-soft text-xs">
                    {format(new Date(client.createdAt), "dd MMM yyyy", { locale: ptBR })}
                  </td>

                  {/* Ações */}
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {editingId === client.id ? (
                        <>
                          <button
                            onClick={() => handleSaveEdit(client)}
                            disabled={isPending}
                            className="p-1.5 rounded text-green-600 hover:bg-green-50 transition-colors"
                            title="Salvar"
                          >
                            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1.5 rounded text-gray-400 hover:bg-gray-100 transition-colors"
                            title="Cancelar"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEdit(client)}
                            className="p-1.5 rounded text-gray-400 hover:text-tecnasa-primary hover:bg-tecnasa-primary/5 transition-colors"
                            title="Editar"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(client.id, client.clerkId, client.name)}
                            className="p-1.5 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="Remover acesso"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function FormField({
  label, name, value, onChange, type = "text", placeholder,
}: {
  label: string; name: string; value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  type?: string; placeholder?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-text-soft uppercase tracking-wider">{label}</label>
      <input
        name={name} type={type} value={value} onChange={onChange}
        placeholder={placeholder}
        className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm
                   focus:outline-none focus:ring-2 focus:ring-tecnasa-primary/50 focus:border-tecnasa-primary"
      />
    </div>
  )
}