"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Layers } from "lucide-react"
import { registerUser } from "@/app/actions"

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError("")

    // Chama a nossa Server Action
    const result = await registerUser(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      // Se deu sucesso, joga o usuário para a tela de login para ele entrar
      router.push("/login?registered=true")
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
          Criar nova conta
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm border border-gray-200 sm:rounded-lg sm:px-10">
          <form className="space-y-6" action={handleSubmit}>
            <div>
              <Label htmlFor="name" className="text-text-main font-medium">Nome completo</Label>
              <div className="mt-2">
                <Input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="focus-visible:ring-tecnasa-primary"
                  placeholder="Seu nome"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email" className="text-text-main font-medium">E-mail corporativo</Label>
              <div className="mt-2">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
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
                  name="password"
                  type="password"
                  required
                  className="focus-visible:ring-tecnasa-primary"
                  placeholder="Crie uma senha forte"
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

            <Button type="submit" disabled={loading} className="w-full bg-tecnasa-primary text-white hover:bg-dark-primary font-bold transition-colors">
              {loading ? "Criando conta..." : "Cadastrar"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-text-soft">
            Já tem uma conta?{" "}
            <Link href="/login" className="font-medium text-tecnasa-primary hover:text-dark-primary">
              Faça login aqui.
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}