"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Plus } from "lucide-react"
import { createProject } from "@/app/actions" // Importa nossa função do servidor

export function CreateProjectModal() {
  // Controle de estado para abrir e fechar o modal
  const [open, setOpen] = useState(false)

  // Função que intermeia o envio do formulário
  async function action(formData: FormData) {
    await createProject(formData) // Manda salvar no banco
    setOpen(false) // Fecha o modal após terminar
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2 font-medium shadow-md bg-tecnasa-primary text-white hover:bg-dark-primary hover:text-white transition-colors">
          <Plus className="h-4 w-4" /> Novo Processo
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[425px] bg-white">
        <DialogHeader>
          <DialogTitle className="text-dark-primary text-xl">Criar novo processo</DialogTitle>
          <DialogDescription className="text-text-soft">
            Dê um nome e uma breve descrição para o novo projeto ou fluxo de trabalho da Tecnasa.
          </DialogDescription>
        </DialogHeader>
        
        <form action={action}>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="title" className="text-text-main font-medium">
                Título do Processo
              </Label>
              <Input 
                id="title" 
                name="title"
                required 
                placeholder="Ex: Implantação de Servidor" 
                className="col-span-3 border-gray-300 focus-visible:ring-tecnasa-primary" 
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="description" className="text-text-main font-medium">
                Descrição (Opcional)
              </Label>
              <Input 
                id="description" 
                name="description"
                placeholder="Ex: Configuração de rede para o novo cliente" 
                className="col-span-3 border-gray-300 focus-visible:ring-tecnasa-primary" 
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="submit" className="bg-tecnasa-accent text-dark-primary hover:bg-tecnasa-accent/90 font-bold">
              Salvar Processo
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}