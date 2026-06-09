"use client"

import { signOut } from "next-auth/react"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

export function LogoutButton() {
  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={() => signOut({ callbackUrl: "/login" })} // Desloga e joga pro /login
      className="text-text-soft hover:text-red-600 hover:bg-red-50"
      title="Sair da conta"
    >
      <LogOut className="h-5 w-5" />
    </Button>
  )
}