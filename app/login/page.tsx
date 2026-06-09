"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Layers } from "lucide-react"
import Link from "next/link";

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError("")

        // Chama o NextAuth para tentar fazer o login
        const result = await signIn("credentials", {
            email,
            password,
            redirect: false,
        })

        if (result?.error) {
            setError("E-mail ou senha incorretos.")
        } else {
            router.push("/") // Se der certo, joga para o painel de processos
        }
    }

    return (
        <div className="min-h-screen bg-neutral-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                <div className="flex items-center justify-center gap-2 mb-6">
                    <Layers className="text-tecnasa-accent h-10 w-10" />
                    <span className="font-bold text-3xl tracking-wider text-dark-primary">TECNASA</span>
                </div>
                <h2 className="text-center text-2xl font-bold tracking-tight text-text-main">
                    Acesse sua conta
                </h2>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow-sm border border-gray-200 sm:rounded-lg sm:px-10">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <Label htmlFor="email" className="text-text-main font-medium">E-mail corporativo</Label>
                            <div className="mt-2">
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="focus-visible:ring-tecnasa-primary"
                                    placeholder="voce@tecnasa.com"
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="password" className="text-text-main font-medium">Senha</Label>
                            <div className="mt-2">
                                <Input
                                    id="password"
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="focus-visible:ring-tecnasa-primary"
                                />
                            </div>
                        </div>

                        {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

                        <Button type="submit" className="w-full bg-tecnasa-primary text-white hover:bg-dark-primary font-bold transition-colors">
                            Entrar
                        </Button>

                        <div className="mt-6 text-center text-sm text-text-soft">
                            Não tem conta? <Link href="/register" className="font-medium text-tecnasa-primary hover:text-dark-primary">Cadastre-se.</Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}