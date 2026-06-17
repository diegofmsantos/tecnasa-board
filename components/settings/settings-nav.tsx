"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Users, UserCircle, Palette, Tag, Activity, Link2 } from "lucide-react"

const settingsNav = [
  { href: "/settings/clients",      label: "Clientes do Portal",   icon: Users      },
  { href: "/settings/profile",      label: "Meu Perfil",           icon: UserCircle },
  { href: "/settings/team",         label: "Equipe",               icon: Users      },
  { href: "/settings/integrations", label: "Integrações",          icon: Link2      },
  { href: "/settings/appearance",   label: "Personalização",       icon: Palette    },
  { href: "/settings/deliverables", label: "Tipos de Entregável",  icon: Tag        },
  { href: "/settings/activity",     label: "Histórico",            icon: Activity   },
]

export function SettingsNav() {
  const pathname = usePathname()

  return (
    <nav className="w-56 flex-shrink-0">
      <ul className="space-y-1">
        {settingsNav.map((item) => {
          const isActive = pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-tecnasa-primary text-white"
                    : "text-text-soft hover:bg-white hover:text-dark-primary"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-tecnasa-accent" : ""}`} />
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}