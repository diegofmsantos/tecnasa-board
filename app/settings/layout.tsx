import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { SettingsNav } from "@/components/settings/settings-nav"

export default function SettingsLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-neutral-bg text-text-main flex flex-col">
            <Sidebar />
            <Header />

            <main className="pl-72 pt-24 pr-8 pb-8 flex-1">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold tracking-tight text-dark-primary">Configurações</h1>
                    <p className="text-text-soft text-sm">Gerencie usuários, aparência e preferências da plataforma.</p>
                </div>

                <div className="flex gap-8">
                    {/* Menu lateral — Client Component separado */}
                    <SettingsNav />

                    {/* Conteúdo */}
                    <div className="flex-1 min-w-0">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    )
}