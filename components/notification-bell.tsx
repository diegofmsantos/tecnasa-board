"use client"

import { useState, useTransition, useEffect, useRef } from "react"
import { Bell, Check, CheckCheck, AlertTriangle, AlertCircle, Info, X } from "lucide-react"
import { markAsRead, markAllAsRead } from "@/app/actions-notifications"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Notification {
    id: string
    title: string
    message: string
    type: string
    read: boolean
    createdAt: Date
}

interface Props {
    initialNotifications: Notification[]
    initialUnread: number
}

const TYPE_CONFIG = {
    DANGER: { icon: AlertCircle, color: "text-red-500", bg: "bg-red-50" },
    WARNING: { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-50" },
    INFO: { icon: Info, color: "text-blue-500", bg: "bg-blue-50" },
}

export function NotificationBell({ initialNotifications, initialUnread }: Props) {
    const [open, setOpen] = useState(false)
    const [notifications, setNotifications] = useState(initialNotifications)
    const [unread, setUnread] = useState(initialUnread)
    const [isPending, startTransition] = useTransition()
    const ref = useRef<HTMLDivElement>(null)

    // Fecha ao clicar fora
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClick)
        return () => document.removeEventListener("mousedown", handleClick)
    }, [])

    function handleMarkAsRead(id: string) {
        startTransition(async () => {
            await markAsRead(id)
            setNotifications((prev) =>
                prev.map((n) => n.id === id ? { ...n, read: true } : n)
            )
            setUnread((prev) => Math.max(0, prev - 1))
        })
    }

    function handleMarkAllAsRead() {
        startTransition(async () => {
            await markAllAsRead()
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
            setUnread(0)
        })
    }

    return (
        <div className="relative" ref={ref}>
            {/* Botão do sino */}
            <button
                onClick={() => setOpen((v) => !v)}
                className="relative p-2 rounded-lg text-text-soft hover:text-dark-primary hover:bg-gray-100 transition-colors"
                title="Notificações"
            >
                <Bell className="h-5 w-5" />
                {unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {unread > 9 ? "9+" : unread}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-dark-primary text-sm">Notificações</h3>
                            {unread > 0 && (
                                <span className="bg-red-100 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                    {unread} nova{unread > 1 ? "s" : ""}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                            {unread > 0 && (
                                <button
                                    onClick={handleMarkAllAsRead}
                                    disabled={isPending}
                                    className="text-xs text-tecnasa-primary hover:underline flex items-center gap-1 font-medium"
                                >
                                    <CheckCheck className="h-3.5 w-3.5" />
                                    Marcar todas
                                </button>
                            )}
                            <button
                                onClick={() => setOpen(false)}
                                className="ml-2 p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>

                    {/* Lista */}
                    <div className="max-h-[420px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-text-soft gap-2">
                                <Bell className="h-8 w-8 opacity-20" />
                                <p className="text-sm">Nenhuma notificação.</p>
                            </div>
                        ) : (
                            notifications.map((n) => {
                                const cfg = TYPE_CONFIG[n.type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.INFO
                                const Icon = cfg.icon
                                return (
                                    <div
                                        key={n.id}
                                        className={`flex gap-3 px-4 py-3 border-b border-gray-50 transition-colors ${n.read ? "bg-white" : "bg-blue-50/30"
                                            }`}
                                    >
                                        <div className={`p-1.5 rounded-lg flex-shrink-0 h-fit ${cfg.bg}`}>
                                            <Icon className={`h-4 w-4 ${cfg.color}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-dark-primary">{n.title}</p>
                                            <p className="text-xs text-text-soft mt-0.5 leading-relaxed">{n.message}</p>
                                            <p className="text-[10px] text-gray-400 mt-1">
                                                {format(new Date(n.createdAt), "dd MMM 'às' HH:mm", { locale: ptBR })}
                                            </p>
                                        </div>
                                        {!n.read && (
                                            <button
                                                onClick={() => handleMarkAsRead(n.id)}
                                                className="flex-shrink-0 p-1 rounded text-gray-300 hover:text-tecnasa-primary transition-colors"
                                                title="Marcar como lida"
                                            >
                                                <Check className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}