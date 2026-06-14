import { currentUser } from "@clerk/nextjs/server"
import { LogoutButton } from "./logout-button"
import { NotificationBell } from "./notification-bell"
import { getNotifications, getUnreadCount, generateDeadlineNotifications } from "@/app/actions-notifications"

export async function Header() {
  const user = await currentUser()

  const name = user?.fullName ?? user?.firstName ?? "Usuário"
  const email = user?.emailAddresses?.[0]?.emailAddress ?? ""
  const initial = name.charAt(0).toUpperCase()

  // Gera notificações de prazo e busca as existentes
  await generateDeadlineNotifications()
  const [notifications, unread] = await Promise.all([
    getNotifications(),
    getUnreadCount(),
  ])

  return (
    <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-8 fixed top-0 right-0 left-64 z-10">
      <div>
        <h2 className="text-sm text-text-soft font-medium">Bem-vindo de volta!</h2>
      </div>

      <div className="flex items-center gap-3">
        {/* Sino de notificações */}
        <NotificationBell
          initialNotifications={notifications}
          initialUnread={unread}
        />

        <div className="h-8 w-px bg-gray-200" />

        <div className="text-right hidden md:block">
          <p className="text-sm font-semibold text-text-main">{name}</p>
          <p className="text-xs text-text-soft">{email}</p>
        </div>

        <div className="w-10 h-10 rounded-full bg-tecnasa-primary text-white flex items-center justify-center font-bold shadow-sm">
          {initial}
        </div>

        <div className="h-8 w-px bg-gray-200" />

        <LogoutButton />
      </div>
    </header>
  )
}