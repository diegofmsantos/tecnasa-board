import { SignIn } from "@clerk/nextjs"
import { Layers } from "lucide-react"

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-dark-primary flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
                <div className="flex items-center justify-center gap-2 mb-6">
                    <Layers className="text-tecnasa-accent h-10 w-10" />
                    <span className="font-bold text-3xl tracking-wider text-white">TECNASA</span>
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-tecnasa-accent">
                    Acesse sua conta
                </h2>
            </div>

            <div className="flex justify-center">
                <SignIn
                    appearance={{
                        elements: {
                            rootBox: "w-full max-w-md",
                            card: "shadow-sm border border-gray-200 rounded-lg",
                            headerTitle: "hidden",
                            headerSubtitle: "hidden",
                            socialButtonsBlockButton: "border border-gray-300 hover:bg-gray-50",
                            formButtonPrimary:
                                "bg-tecnasa-primary hover:bg-dark-primary text-white font-bold transition-colors",
                            footerActionLink: "text-tecnasa-primary hover:text-dark-primary font-medium",
                            formFieldInput:
                                "border border-gray-300 focus:border-tecnasa-primary focus:ring-tecnasa-primary/30",
                        },
                    }}
                />
            </div>
        </div>
    )
}