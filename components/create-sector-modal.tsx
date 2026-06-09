"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Plus, Network } from "lucide-react"
import { createSector } from "@/app/actions"

export function CreateSectorModal({ companyId }: { companyId: string }) {
    const [open, setOpen] = useState(false)

    async function action(formData: FormData) {
        await createSector(formData)
        setOpen(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-tecnasa-primary text-white hover:bg-dark-primary transition-colors shadow-md">
                    <Plus className="h-4 w-4 mr-2" /> Novo Setor
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[425px] bg-white">
                <DialogHeader>
                    <DialogTitle className="text-dark-primary text-xl flex items-center gap-2">
                        <Network className="h-5 w-5 text-tecnasa-primary" />
                        Adicionar Setor
                    </DialogTitle>
                </DialogHeader>

                <form action={action}>
                    {/* Campo oculto para enviar o ID da Empresa */}
                    <input type="hidden" name="companyId" value={companyId} />

                    <div className="grid gap-4 py-4">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="name" className="text-text-main font-medium">Nome do Setor</Label>
                            <Input
                                id="name"
                                name="name"
                                required
                                placeholder="Ex: Comercial, RH, Logística..."
                                className="border-gray-300 focus-visible:ring-tecnasa-primary"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="submit" className="bg-tecnasa-accent text-dark-primary hover:bg-tecnasa-accent/90 font-bold">
                            Salvar Setor
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}