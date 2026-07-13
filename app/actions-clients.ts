"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { clerkClient } from "@clerk/nextjs/server"
import { requireAdmin, toActionError } from "@/lib/auth"
import { createClientUserSchema, formatZodError } from "@/lib/validations"

/**
 * Cria um novo usuário cliente:
 * 1. Cria no Clerk com senha temporária
 * 2. Define role "client" no publicMetadata
 * 3. Salva no banco vinculado à empresa
 */
export async function createClientUser(formData: FormData) {
    try {
        await requireAdmin()
        const parsed = createClientUserSchema.safeParse({
            name: formData.get("name"),
            email: formData.get("email"),
            password: formData.get("password"),
            companyId: formData.get("companyId"),
        })
        if (!parsed.success) return { error: formatZodError(parsed.error) }
        const { name, email, password, companyId } = parsed.data

        const clerk = await clerkClient()

        // 1. Cria o usuário no Clerk
        const clerkUser = await clerk.users.createUser({
            firstName: name.split(" ")[0],
            lastName: name.split(" ").slice(1).join(" ") || undefined,
            emailAddress: [email],
            password,
            publicMetadata: { role: "client" },
        })

        // 2. Salva no banco
        await prisma.clientUser.create({
            data: {
                clerkId: clerkUser.id,
                name,
                email,
                companyId,
            },
        })

        revalidatePath("/settings/clients")
        return { success: true }
    } catch (err: unknown) {
        return toActionError(err, "Erro ao criar usuário.")
    }
}

/**
 * Remove o acesso do cliente:
 * 1. Deleta o usuário no Clerk
 * 2. Remove o registro do banco
 */
export async function deleteClientUser(clientUserId: string, clerkId: string) {
    try {
        await requireAdmin()

        try {
            const clerk = await clerkClient()
            await clerk.users.deleteUser(clerkId)
        } catch {
            // Se já não existe no Clerk, continua e remove do banco
        }

        await prisma.clientUser.delete({ where: { id: clientUserId } })
        revalidatePath("/settings/clients")
        return { success: true }
    } catch (err) {
        return toActionError(err, "Erro ao remover usuário.")
    }
}

/**
 * Atualiza nome e e-mail do cliente no Clerk e no banco
 */
export async function updateClientUser(
    clientUserId: string,
    clerkId: string,
    name: string,
    email: string
) {
    try {
        await requireAdmin()
        if (!name?.trim() || !email?.trim()) return { error: "Nome e e-mail são obrigatórios." }

        const clerk = await clerkClient()

        // Atualiza no Clerk
        await clerk.users.updateUser(clerkId, {
            firstName: name.split(" ")[0],
            lastName: name.split(" ").slice(1).join(" ") || undefined,
        })

        // Atualiza o e-mail no Clerk — precisa adicionar e definir como primário
        const clerkUser = await clerk.users.getUser(clerkId)
        const existingEmail = clerkUser.emailAddresses.find(
            (e) => e.emailAddress === email
        )
        if (!existingEmail) {
            await clerk.emailAddresses.createEmailAddress({
                userId: clerkId,
                emailAddress: email,
                verified: true,
                primary: true,
            })
        }

        // Atualiza no banco
        await prisma.clientUser.update({
            where: { id: clientUserId },
            data: { name, email },
        })

        revalidatePath("/settings/clients")
        return { success: true }
    } catch (err) {
        return toActionError(err, "Erro ao atualizar.")
    }
}


export async function updateClientCompany(clientUserId: string, companyId: string) {
    try {
        await requireAdmin()
        await prisma.clientUser.update({
            where: { id: clientUserId },
            data: { companyId },
        })
        revalidatePath("/settings/clients")
        return { success: true }
    } catch (err) {
        return toActionError(err, "Erro ao atualizar empresa do cliente.")
    }
}
