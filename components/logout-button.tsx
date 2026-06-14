"use client"

import { useClerk } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

export function LogoutButton() {
  const { signOut } = useClerk()
  const router = useRouter()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => signOut(() => router.push("/login"))}
      className="text-text-soft hover:text-red-600 hover:bg-red-50"
      title="Sair da conta"
    >
      <LogOut className="h-5 w-5" />
    </Button>
  )
}