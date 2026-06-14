"use client"

import { useState, useTransition } from "react"
import {
    Users, Plus, Trash2, X, Check, Loader2,
    Mail, Shield, RefreshCw, Eye, EyeOff,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { createTeamMember, deleteTeamMember, updateTeamMemberRole } from "@/app/actions.team"

interface TeamMember {
    id: string
    clerkId: string
    name: string
    email: string
    role: string
    createdAt: Date
    imageUrl?: string | null
}

const ROLE_CONFIG = {
    ADMIN: { label: "Admin", color: "bg-purple-100 text-purple-700 border-purple-200" },
    CONSULTOR: { label: "Consultor", color: "bg-blue-100 text-blue-700 border-blue-200" },
}

function generatePassword() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!"
    return Array.from({ length: 12 }, () =>
        chars[Math.floor(Math.random() * chars.length)]
    ).join("")
}

export function TeamManager({ users: initial }: { users: TeamMember[] }) {
    const [members, setMembers] = useState(initial)
    const [showForm, setShowForm] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState("")
    const [showPassword, setShowPassword] = useState(false)

    const [form, setForm] = useState({
        name: "",
        email: "",
        password: generatePassword(),
        role: "CONSULTOR",
    })

    function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    }

    function handleCreate() {
        setError("")
        if (!form.name || !form.email || !form.password) {
            setError("Preencha todos os campos.")
            return
        }

        const fd = new FormData()
        Object.entries(form).forEach(([k, v]) => fd.set(k, v))

        startTransition(async () => {
            const result = await createTeamMember(fd)
            if (result.error) { setError(result.error); return }
            setMembers((prev) => [
                { id: crypto.randomUUID(), clerkId: "", name: form.name, email: form.email, role: form.role, createdAt: new Date() },
                ...prev,
            ])
            setForm({ name: "", email: "", password: generatePassword(), role: "CONSULTOR" })
            setShowForm(false)
        })
    }

    function handleDelete(id: string, clerkId: string, name: string) {
        if (!window.confirm(`Remover "${name}" da equipe?`)) return
        startTransition(async () => {
            await deleteTeamMember(id, clerkId)
            setMembers((prev) => prev.filter((m) => m.id !== id))
        })
    }

    function handleRoleChange(id: string, role: string) {
        startTransition(async () => {
            await updateTeamMemberRole(id, role)
            setMembers((prev) => prev.map((m) => m.id === id ? { ...m, role } : m))
        })
    }

    return (
        <div className={isPending ? "opacity-70 pointer-events-none" : ""}>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-bold text-dark-primary flex items-center gap-2">
                        <Users className="h-5 w-5 text-tecnasa-primary" />
                        Equipe Tecnasa
                    </h2>
                    <p className="text-sm text-text-soft mt-0.5">
                        Membros com acesso à área interna da plataforma.
                    </p>
                </div>
                <Button
                    onClick={() => { setShowForm((v) => !v); setError("") }}
                    className="bg-tecnasa-primary text-tecnasa-accent hover:bg-dark-primary transition-colors shadow-md"
                >
                    {showForm
                        ? <><X className="h-4 w-4 mr-2" /> Cancelar</>
                        : <><Plus className="h-4 w-4 mr-2" /> Novo Membro</>
                    }
                </Button>
            </div>

            {/* Formulário */}
            {showForm && (
                <div className="bg-white border border-tecnasa-primary/30 rounded-xl p-6 mb-6 shadow-sm">
                    <h3 className="text-sm font-bold text-dark-primary mb-4">Adicionar Membro da Equipe</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-text-soft uppercase tracking-wider">Nome completo *</label>
                            <input name="name" value={form.name} onChange={handleChange} placeholder="Nome do membro"
                                className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-tecnasa-primary/50 focus:border-tecnasa-primary" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-text-soft uppercase tracking-wider">E-mail *</label>
                            <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="membro@tecnasa.com.br"
                                className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-tecnasa-primary/50 focus:border-tecnasa-primary" />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-text-soft uppercase tracking-wider">Senha temporária *</label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <input name="password" type={showPassword ? "text" : "password"} value={form.password} onChange={handleChange}
                                        className="h-9 w-full rounded-md border border-gray-300 px-3 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-tecnasa-primary/50 focus:border-tecnasa-primary" />
                                    <button type="button" onClick={() => setShowPassword((v) => !v)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                <button type="button" onClick={() => setForm((p) => ({ ...p, password: generatePassword() }))}
                                    className="h-9 w-9 flex items-center justify-center rounded-md border border-gray-300 text-gray-500 hover:text-tecnasa-primary hover:border-tecnasa-primary transition-colors">
                                    <RefreshCw className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-text-soft uppercase tracking-wider">Perfil de acesso</label>
                            <select name="role" value={form.role} onChange={handleChange}
                                className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-tecnasa-primary/50 focus:border-tecnasa-primary">
                                <option value="ADMIN">Admin — acesso total</option>
                                <option value="CONSULTOR">Consultor — acesso padrão</option>
                            </select>
                        </div>
                    </div>

                    {error && <p className="text-sm text-red-600 font-medium mt-3">{error}</p>}

                    <div className="flex justify-end mt-4">
                        <Button onClick={handleCreate} disabled={isPending}
                            className="bg-tecnasa-accent text-dark-primary hover:bg-tecnasa-accent/90 font-bold">
                            {isPending
                                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Criando...</>
                                : <><Check className="h-4 w-4 mr-2" /> Adicionar Membro</>
                            }
                        </Button>
                    </div>
                </div>
            )}

            {/* Tabela de membros */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-3 text-left text-[11px] font-semibold text-text-soft uppercase tracking-wider">Membro</th>
                            <th className="px-6 py-3 text-left text-[11px] font-semibold text-text-soft uppercase tracking-wider">Perfil</th>
                            <th className="px-6 py-3 text-left text-[11px] font-semibold text-text-soft uppercase tracking-wider">Desde</th>
                            <th className="px-6 py-3 text-center text-[11px] font-semibold text-text-soft uppercase tracking-wider w-16">Ação</th>
                        </tr>
                    </thead>
                    <tbody>
                        {members.length === 0 ? (
                            <tr><td colSpan={4} className="px-6 py-8 text-center text-text-soft italic">Nenhum membro cadastrado.</td></tr>
                        ) : (
                            members.map((member, i) => {
                                const roleCfg = ROLE_CONFIG[member.role as keyof typeof ROLE_CONFIG] ?? ROLE_CONFIG.CONSULTOR
                                return (
                                    <tr key={member.id} className={`border-b border-gray-50 hover:bg-gray-50/50 ${i === members.length - 1 ? "border-0" : ""}`}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full overflow-hidden border border-gray-200 flex-shrink-0">
                                                    {member.imageUrl ? (
                                                        <img
                                                            src={member.imageUrl}
                                                            alt={member.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-tecnasa-primary text-white flex items-center justify-center font-bold text-sm">
                                                            {member.name.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-dark-primary">{member.name}</p>
                                                    <p className="text-xs text-text-soft flex items-center gap-1">
                                                        <Mail className="h-3 w-3" /> {member.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <select
                                                defaultValue={member.role}
                                                onChange={(e) => handleRoleChange(member.id, e.target.value)}
                                                className={`text-xs font-bold px-2.5 py-1 rounded-full border appearance-none cursor-pointer focus:outline-none ${roleCfg.color}`}
                                            >
                                                <option value="ADMIN">Admin</option>
                                                <option value="CONSULTOR">Consultor</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4 text-text-soft text-xs">
                                            {format(new Date(member.createdAt), "dd MMM yyyy", { locale: ptBR })}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button onClick={() => handleDelete(member.id, member.clerkId, member.name)}
                                                className="text-gray-300 hover:text-red-500 transition-colors p-1">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}