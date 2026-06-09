"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Plus, Users } from "lucide-react"
import { createLead } from "@/app/actions"

export function CreateLeadModal() {
    const [open, setOpen] = useState(false)

    async function action(formData: FormData) {
        await createLead(formData)
        setOpen(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-tecnasa-primary text-white hover:bg-dark-primary transition-colors shadow-md">
                    <Plus className="h-4 w-4 mr-2" /> Novo Prospecto
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[500px] bg-white">
                <DialogHeader>
                    <DialogTitle className="text-dark-primary text-xl flex items-center gap-2">
                        <Users className="h-5 w-5 text-tecnasa-primary" />
                        Cadastrar Oportunidade (CRM)
                    </DialogTitle>
                </DialogHeader>

                <form action={action}>
                    <div className="grid gap-4 py-4">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="name">Razão Social / Nome Fantasia *</Label>
                            <Input id="name" name="name" required placeholder="Ex: Clínica Saúde Ltda" className="border-gray-300" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="cnpj">CNPJ</Label>
                                <Input id="cnpj" name="cnpj" placeholder="00.000.000/0000-00" className="border-gray-300" />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="segment">Segmento</Label>
                                <Input id="segment" name="segment" placeholder="Ex: Odontologia" className="border-gray-300" />
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="contactRole">Contato & Cargo/Função</Label>
                            <Input id="contactRole" name="contactRole" placeholder="Ex: Dr. Carlos (Diretor Clínico)" className="border-gray-300" />
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="address">Endereço Completo</Label>
                            <Input id="address" name="address" placeholder="Rua, Número, Bairro, Cidade - UF" className="border-gray-300" />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="submit" className="bg-tecnasa-accent text-dark-primary hover:bg-tecnasa-accent/90 font-bold">
                            Salvar Prospecto
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}