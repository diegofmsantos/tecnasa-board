"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Plus, Building2 } from "lucide-react"
import { createCompany } from "@/app/actions"

export function CreateCompanyModal() {
  const [open, setOpen] = useState(false)

  async function action(formData: FormData) {
    await createCompany(formData)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-tecnasa-primary text-tecnasa-accent hover:bg-dark-primary transition-colors shadow-md">
          <Plus className="h-4 w-4 mr-2" /> Nova Empresa
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[425px] bg-white">
        <DialogHeader>
          <DialogTitle className="text-dark-primary text-xl flex items-center gap-2">
            <Building2 className="h-5 w-5 text-tecnasa-primary" />
            Cadastrar Cliente
          </DialogTitle>
        </DialogHeader>
        
        <form action={action}>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name" className="text-text-main font-medium">
                Nome da Empresa
              </Label>
              <Input 
                id="name" 
                name="name" 
                required 
                placeholder="Ex: Safety Cirúrgica" 
                className="border-gray-300 focus-visible:ring-tecnasa-primary" 
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="submit" className="bg-tecnasa-accent text-dark-primary hover:bg-tecnasa-accent/90 font-bold">
              Salvar Empresa
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}