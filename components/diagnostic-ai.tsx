"use client"

import { useState, useTransition, useRef, useEffect } from "react"
import {
    createTranscript, deleteTranscript,
    createDiagnosticSession, getDiagnosticSession,
    deleteDiagnosticSession, sendMessageToAI,
} from "@/app/actions-diagnostic"
import {
    Brain, Plus, Trash2, FileText, MessageSquare,
    Send, Loader2, X, ChevronRight, Check, ArrowLeft,
    Sparkles, AlertCircle, Upload,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Transcript {
    id: string
    title: string
    content: string
    createdAt: Date
    sector?: { id: string; name: string } | null
    user?: { name: string } | null
}

interface Session {
    id: string
    title: string
    createdAt: Date
    updatedAt: Date
    transcripts: { id: string; title: string }[]
    user?: { name: string } | null
}

interface Message {
    role: "user" | "assistant"
    content: string
}

interface Props {
    companyId: string
    companyName: string
    sectors: { id: string; name: string }[]
    initialTranscripts: Transcript[]
    initialSessions: Session[]
    apiEnabled: boolean
}

type View = "home" | "new-transcript" | "new-session" | "chat"

export function DiagnosticAI({
    companyId,
    companyName,
    sectors = [],
    initialTranscripts = [],
    initialSessions = [],
    apiEnabled = false,
}: Props) {
    const [view, setView] = useState<View>("home")
    const [transcripts, setTranscripts] = useState<Transcript[]>(initialTranscripts)
    const [sessions, setSessions] = useState<Session[]>(initialSessions)
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState("")

    const [transcriptForm, setTranscriptForm] = useState({ title: "", content: "", sectorId: "", file: null as File | null })
    const [sessionTitle, setSessionTitle] = useState("")
    const [selectedTranscripts, setSelectedTranscripts] = useState<string[]>([])

    const [activeSession, setActiveSession] = useState<any>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [userInput, setUserInput] = useState("")
    const [sending, setSending] = useState(false)
    const bottomRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    // ── Criar transcrição ──────────────────────────────────────────────────────
    function handleCreateTranscript() {
        setError("")
        if (!transcriptForm.title) { setError("Título é obrigatório."); return }
        if (!transcriptForm.file && !transcriptForm.content.trim()) {
            setError("Adicione o texto ou faça upload de um arquivo.")
            return
        }
        const fd = new FormData()
        fd.set("title", transcriptForm.title)
        fd.set("companyId", companyId)
        fd.set("sectorId", transcriptForm.sectorId)
        if (transcriptForm.file) {
            fd.set("file", transcriptForm.file)
        } else {
            fd.set("content", transcriptForm.content)
        }

        startTransition(async () => {
            const result = await createTranscript(fd)
            if (result.error) { setError(result.error); return }
            const { getTranscripts } = await import("@/app/actions-diagnostic")
            const updated = await getTranscripts(companyId)
            setTranscripts(updated as any)
            setTranscriptForm({ title: "", content: "", sectorId: "", file: null })
            setView("home")
        })
    }

    // ── Deletar transcrição ────────────────────────────────────────────────────
    function handleDeleteTranscript(id: string, title: string) {
        if (!window.confirm(`Remover "${title}"?`)) return
        startTransition(async () => {
            await deleteTranscript(id, companyId)
            setTranscripts((prev) => prev.filter((t) => t.id !== id))
        })
    }

    // ── Criar sessão ───────────────────────────────────────────────────────────
    function handleCreateSession() {
        setError("")
        if (!sessionTitle) { setError("Dê um título à sessão."); return }
        if (selectedTranscripts.length === 0) { setError("Selecione ao menos uma transcrição."); return }

        startTransition(async () => {
            const session = await createDiagnosticSession(companyId, sessionTitle, selectedTranscripts)
            setSessions((prev) => [session as any, ...prev])
            setSessionTitle("")
            setSelectedTranscripts([])
            await openSession(session as any)
        })
    }

    // ── Abrir sessão de chat ───────────────────────────────────────────────────
    async function openSession(session: Session) {
        const full = await getDiagnosticSession(session.id)
        setActiveSession(full)
        const rawMessages = (full?.messages as any[]) ?? []
        const safeMessages: Message[] = rawMessages.filter(
            (m) => m && typeof m.role === "string" && typeof m.content === "string"
        )
        setMessages(safeMessages)
        setView("chat")
    }

    // ── Deletar sessão ─────────────────────────────────────────────────────────
    function handleDeleteSession(id: string) {
        if (!window.confirm("Remover esta sessão de diagnóstico?")) return
        startTransition(async () => {
            await deleteDiagnosticSession(id, companyId)
            setSessions((prev) => prev.filter((s) => s.id !== id))
            if (activeSession?.id === id) setView("home")
        })
    }

    // ── Enviar mensagem ────────────────────────────────────────────────────────
    async function handleSend() {
        if (!userInput.trim() || !activeSession || sending) return
        const text = userInput
        setUserInput("")
        setSending(true)
        setMessages((prev) => [...prev, { role: "user", content: text }])

        const result = await sendMessageToAI(activeSession.id, companyId, text)

        if (result.error) {
            setMessages((prev) => [...prev, { role: "assistant", content: `⚠️ ${result.error}` }])
        } else {
            setMessages((prev) => [...prev, { role: "assistant", content: result.message! }])
        }
        setSending(false)
    }

    // ─── HOME ──────────────────────────────────────────────────────────────────
    if (view === "home") return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-bold text-dark-primary flex items-center gap-2">
                        <Brain className="h-5 w-5 text-tecnasa-primary" />
                        Diagnóstico IA
                    </h2>
                    <p className="text-sm text-text-soft mt-0.5">
                        Analise transcrições de reuniões com inteligência artificial.
                    </p>
                </div>
                {!apiEnabled && (
                    <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-3 py-2 rounded-lg text-xs font-medium">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        Módulo de IA aguardando ativação
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Transcrições */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-dark-primary flex items-center gap-2 text-sm">
                            <FileText className="h-4 w-4 text-tecnasa-primary" />
                            Transcrições ({transcripts.length})
                        </h3>
                        <Button size="sm" onClick={() => setView("new-transcript")}
                            className="bg-tecnasa-primary text-white hover:bg-dark-primary h-8 text-xs">
                            <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar
                        </Button>
                    </div>

                    {transcripts.length === 0 ? (
                        <div className="border-2 border-dashed border-gray-200 rounded-lg h-32 flex items-center justify-center text-text-soft text-sm italic">
                            Nenhuma transcrição cadastrada.
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                            {transcripts.map((t) => (
                                <div key={t.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-gray-100 hover:bg-gray-50 group">
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-dark-primary truncate">{t.title}</p>
                                        <p className="text-[10px] text-text-soft mt-0.5">
                                            {t.sector?.name && <span className="mr-2">{t.sector.name}</span>}
                                            {format(new Date(t.createdAt), "dd MMM yyyy", { locale: ptBR })}
                                        </p>
                                    </div>
                                    <button onClick={() => handleDeleteTranscript(t.id, t.title)}
                                        className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1 flex-shrink-0">
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Sessões */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-dark-primary flex items-center gap-2 text-sm">
                            <MessageSquare className="h-4 w-4 text-tecnasa-primary" />
                            Sessões de Análise ({sessions.length})
                        </h3>
                        <Button size="sm"
                            onClick={() => transcripts.length > 0 ? setView("new-session") : setError("Adicione transcrições primeiro.")}
                            className="bg-tecnasa-primary text-white hover:bg-dark-primary h-8 text-xs">
                            <Plus className="h-3.5 w-3.5 mr-1" /> Nova Sessão
                        </Button>
                    </div>

                    {error && <p className="text-xs text-red-600 mb-3">{error}</p>}

                    {sessions.length === 0 ? (
                        <div className="border-2 border-dashed border-gray-200 rounded-lg h-32 flex items-center justify-center text-text-soft text-sm italic">
                            Nenhuma sessão iniciada.
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                            {sessions.map((s) => (
                                <div key={s.id}
                                    className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-gray-100 hover:bg-gray-50 group cursor-pointer"
                                    onClick={() => openSession(s)}>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-dark-primary truncate">{s.title}</p>
                                        <p className="text-[10px] text-text-soft mt-0.5">
                                            {s.transcripts.length} transcrição(ões) ·{" "}
                                            {format(new Date(s.updatedAt), "dd MMM yyyy", { locale: ptBR })}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteSession(s.id) }}
                                            className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1">
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                        <ChevronRight className="h-4 w-4 text-gray-400" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )

    // ─── NOVA TRANSCRIÇÃO ──────────────────────────────────────────────────────
    if (view === "new-transcript") return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
                <button onClick={() => { setView("home"); setError("") }}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                    <ArrowLeft className="h-4 w-4" />
                </button>
                <h2 className="font-bold text-dark-primary">Nova Transcrição</h2>
            </div>

            <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-text-soft uppercase tracking-wider">Título da reunião *</label>
                        <input value={transcriptForm.title}
                            onChange={(e) => setTranscriptForm((p) => ({ ...p, title: e.target.value }))}
                            placeholder="Ex: Reunião Comercial — 10/06/2026"
                            className="h-9 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-tecnasa-primary/50 focus:border-tecnasa-primary" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-text-soft uppercase tracking-wider">Setor (opcional)</label>
                        <select value={transcriptForm.sectorId}
                            onChange={(e) => setTranscriptForm((p) => ({ ...p, sectorId: e.target.value }))}
                            className="h-9 rounded-md border border-gray-300 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-tecnasa-primary/50 focus:border-tecnasa-primary">
                            <option value="">Reunião geral</option>
                            {sectors.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                </div>

                {/* Upload de arquivo */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-text-soft uppercase tracking-wider">
                        Upload de arquivo (opcional)
                    </label>
                    <div className={`border-2 border-dashed rounded-lg p-4 transition-colors ${transcriptForm.file
                        ? "border-tecnasa-primary bg-tecnasa-primary/5"
                        : "border-gray-300 hover:border-gray-400"
                        }`}>
                        {transcriptForm.file ? (
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-tecnasa-primary" />
                                    <div>
                                        <p className="text-sm font-medium text-dark-primary">{transcriptForm.file.name}</p>
                                        <p className="text-[10px] text-text-soft">
                                            {(transcriptForm.file.size / 1024).toFixed(1)} KB
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setTranscriptForm((p) => ({ ...p, file: null }))}
                                    className="text-gray-400 hover:text-red-500 p-1"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        ) : (
                            <label className="flex flex-col items-center gap-2 cursor-pointer">
                                <Upload className="h-8 w-8 text-gray-400" />
                                <span className="text-sm text-text-soft">Clique para selecionar ou arraste o arquivo</span>
                                <span className="text-xs text-gray-400">Suporta .txt, .pdf e .docx</span>
                                <input
                                    type="file"
                                    accept=".txt,.pdf,.docx"
                                    className="hidden"
                                    onChange={(e) => {
                                        const f = e.target.files?.[0]
                                        if (f) setTranscriptForm((p) => ({ ...p, file: f, content: "" }))
                                    }}
                                />
                            </label>
                        )}
                    </div>
                </div>

                {/* Divisor — só aparece quando não há arquivo */}
                {!transcriptForm.file && (
                    <>
                        <div className="flex items-center gap-3">
                            <div className="flex-1 h-px bg-gray-200" />
                            <span className="text-xs text-text-soft font-medium">ou cole o texto abaixo</span>
                            <div className="flex-1 h-px bg-gray-200" />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-text-soft uppercase tracking-wider">
                                Transcrição completa
                            </label>
                            <textarea
                                value={transcriptForm.content}
                                onChange={(e) => setTranscriptForm((p) => ({ ...p, content: e.target.value }))}
                                placeholder="Cole aqui a transcrição completa da reunião..."
                                rows={14}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-text-main
                           focus:outline-none focus:ring-2 focus:ring-tecnasa-primary/50 focus:border-tecnasa-primary
                           resize-none font-mono leading-relaxed"
                            />
                            <p className="text-[10px] text-text-soft">
                                {transcriptForm.content.length.toLocaleString("pt-BR")} caracteres
                            </p>
                        </div>
                    </>
                )}

                {error && <p className="text-sm text-red-600">{error}</p>}

                <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => { setView("home"); setError("") }}>Cancelar</Button>
                    <Button onClick={handleCreateTranscript} disabled={isPending}
                        className="bg-tecnasa-primary text-white hover:bg-dark-primary">
                        {isPending
                            ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> {transcriptForm.file ? "Processando..." : "Salvando..."}</>
                            : <><Check className="h-4 w-4 mr-2" /> Salvar Transcrição</>
                        }
                    </Button>
                </div>
            </div>
        </div>
    )

    // ─── NOVA SESSÃO ───────────────────────────────────────────────────────────
    if (view === "new-session") return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
                <button onClick={() => { setView("home"); setError("") }}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                    <ArrowLeft className="h-4 w-4" />
                </button>
                <h2 className="font-bold text-dark-primary">Nova Sessão de Diagnóstico</h2>
            </div>

            <div className="space-y-5">
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-text-soft uppercase tracking-wider">Título da sessão *</label>
                    <input value={sessionTitle} onChange={(e) => setSessionTitle(e.target.value)}
                        placeholder="Ex: Diagnóstico Setor Comercial — Junho 2026"
                        className="h-9 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-tecnasa-primary/50 focus:border-tecnasa-primary" />
                </div>

                <div>
                    <label className="text-xs font-semibold text-text-soft uppercase tracking-wider mb-3 block">
                        Selecione as transcrições para análise *
                    </label>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {transcripts.map((t) => {
                            const selected = selectedTranscripts.includes(t.id)
                            return (
                                <div key={t.id}
                                    onClick={() => setSelectedTranscripts((prev) =>
                                        selected ? prev.filter((id) => id !== t.id) : [...prev, t.id]
                                    )}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-all ${selected
                                        ? "border-tecnasa-primary bg-tecnasa-primary/5"
                                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                        }`}>
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${selected ? "bg-tecnasa-primary border-tecnasa-primary" : "border-gray-300"
                                        }`}>
                                        {selected && <Check className="h-3 w-3 text-white" />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-dark-primary">{t.title}</p>
                                        <p className="text-[10px] text-text-soft">
                                            {t.sector?.name && <span className="mr-2">{t.sector.name}</span>}
                                            {format(new Date(t.createdAt), "dd MMM yyyy", { locale: ptBR })}
                                        </p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => { setView("home"); setError("") }}>Cancelar</Button>
                    <Button onClick={handleCreateSession} disabled={isPending}
                        className="bg-tecnasa-primary text-white hover:bg-dark-primary">
                        {isPending
                            ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Criando...</>
                            : <><Sparkles className="h-4 w-4 mr-2" /> Iniciar Diagnóstico</>
                        }
                    </Button>
                </div>
            </div>
        </div>
    )

    // ─── CHAT ──────────────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col h-[680px] bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100 bg-dark-primary flex-shrink-0">
                <button onClick={() => setView("home")}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                </button>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{activeSession?.title}</p>
                    <p className="text-[10px] text-white/50">
                        {activeSession?.transcripts?.length ?? 0} transcrição(ões) · {companyName}
                    </p>
                </div>
                <Brain className="h-5 w-5 text-tecnasa-accent flex-shrink-0" />
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center text-text-soft gap-3 py-8">
                        <Sparkles className="h-10 w-10 opacity-20" />
                        <div>
                            <p className="font-medium text-sm">
                                Sessão iniciada com {activeSession?.transcripts?.length ?? 0} transcrição(ões)
                            </p>
                            <p className="text-xs mt-1 max-w-sm">
                                Faça perguntas sobre os problemas identificados, peça análise de gargalos ou sugestões de melhoria.
                            </p>
                        </div>
                        {!apiEnabled && (
                            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2 rounded-lg text-xs font-medium mt-2">
                                <AlertCircle className="h-4 w-4" />
                                A IA será ativada em breve. Você pode preparar as transcrições agora.
                            </div>
                        )}
                    </div>
                )}

                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        {msg.role === "assistant" && (
                            <div className="w-7 h-7 rounded-full bg-tecnasa-primary flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                                <Brain className="h-4 w-4 text-white" />
                            </div>
                        )}
                        <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${msg.role === "user"
                            ? "bg-tecnasa-primary text-white rounded-br-sm"
                            : "bg-gray-50 border border-gray-100 text-dark-primary rounded-bl-sm"
                            }`}>
                            {msg.content}
                        </div>
                    </div>
                ))}

                {sending && (
                    <div className="flex justify-start">
                        <div className="w-7 h-7 rounded-full bg-tecnasa-primary flex items-center justify-center mr-2">
                            <Brain className="h-4 w-4 text-white" />
                        </div>
                        <div className="bg-gray-50 border border-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-tecnasa-primary" />
                            <span className="text-sm text-text-soft">Analisando...</span>
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            <div className="px-5 py-4 border-t border-gray-100 flex-shrink-0">
                <div className="flex gap-2 items-end">
                    <textarea
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyDown={(e) => {
                            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                                e.preventDefault()
                                handleSend()
                            }
                        }}
                        placeholder="Faça uma pergunta sobre as transcrições... (Ctrl+Enter para enviar)"
                        rows={2}
                        className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm
                       text-text-main placeholder:text-gray-400 resize-none
                       focus:outline-none focus:ring-2 focus:ring-tecnasa-primary/40
                       focus:border-tecnasa-primary"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!userInput.trim() || sending}
                        className="flex-shrink-0 w-10 h-10 rounded-xl bg-tecnasa-primary text-white
                       flex items-center justify-center hover:bg-dark-primary transition-colors
                       disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <Send className="h-4 w-4" />
                    </button>
                </div>
                <p className="text-[10px] text-gray-400 mt-1.5">Ctrl+Enter para enviar</p>
            </div>
        </div>
    )
}