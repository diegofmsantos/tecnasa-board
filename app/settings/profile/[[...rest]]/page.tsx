import { UserProfile } from "@clerk/nextjs"

export default function SettingsProfilePage() {
    return (
        <div>
            <div className="mb-6">
                <h2 className="text-lg font-bold text-dark-primary">Meu Perfil</h2>
                <p className="text-sm text-text-soft mt-0.5">
                    Gerencie suas informações pessoais, senha e dispositivos conectados.
                </p>
            </div>

            <UserProfile
                appearance={{
                    elements: {
                        rootBox: "w-full",
                        card: "shadow-sm border border-gray-200 rounded-xl w-full",
                        navbar: "hidden",
                        pageScrollBox: "p-6",
                        formButtonPrimary:
                            "bg-tecnasa-primary hover:bg-dark-primary text-white font-bold transition-colors",
                        formFieldInput:
                            "border border-gray-300 focus:border-tecnasa-primary focus:ring-tecnasa-primary/30",
                        badge: "bg-tecnasa-primary/10 text-tecnasa-primary",
                        avatarBox: "rounded-full",
                    },
                }}
            />
        </div>
    )
}