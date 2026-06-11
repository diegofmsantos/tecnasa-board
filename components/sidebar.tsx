"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, CheckSquare, BarChart2, Settings, Users } from "lucide-react"

export function Sidebar() {
  const pathname = usePathname()

  const menuItems = [
    {
      title: "Painel de Projetos",
      href: "/",
      icon: LayoutDashboard
    },
    {
      title: "Minhas Tarefas",
      href: "/my-tasks",
      icon: CheckSquare
    },
    {
      title: "Indicadores",
      href: "/dashboard",
      icon: BarChart2
    },
    {
      title: "CRM",
      href: "/crm",
      icon: Users
    },
  ]

  return (
    <aside className="w-64 bg-dark-primary text-white h-screen fixed left-0 top-0 flex flex-col z-20 shadow-xl">
      {/* Logo da Empresa no topo com divisória sutil */}
      <div className="h-16 flex items-center px-6 border-b border-white/10">
        <span className="font-bold text-2xl tracking-wider text-tecnasa-accent">TECNASA</span>
      </div>

      {/* Navegação principal */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {menuItems.map((item) => {
          const isActive = item.href === "/"
            ? pathname === "/" || pathname.startsWith("/company")
            : pathname === item.href || pathname.startsWith(item.href + "/")

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${isActive
                ? "bg-tecnasa-primary text-white font-bold shadow-md border-l-4 border-tecnasa-accent"
                : "text-white/70 hover:bg-white/10 hover:text-white font-medium"
                }`}
            >
              <item.icon className={`h-5 w-5 ${isActive ? "text-tecnasa-accent" : "text-white/70"}`} />
              {item.title}
            </Link>
          )
        })}
      </nav>

      {/* Rodapé do Sidebar */}
      <div className="p-4 border-t border-white/10">
        <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/70 hover:bg-white/10 hover:text-white font-medium transition-colors w-full">
          <Settings className="h-5 w-5" />
          <span>Configurações</span>
        </button>
      </div>
    </aside>
  )
}