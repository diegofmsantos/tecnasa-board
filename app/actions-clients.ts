"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { clerkClient } from "@clerk/nextjs/server"

/**
 * Busca todos os clientes do portal com suas empresas vinculadas
 */
export async function getClientUsers() {
    return prisma.clientUser.findMany({
        orderBy: { createdAt: "desc" },
        include: { company: { select: { id: true, name: true } } },
    })
}

/**
 * Cria um novo usuário cliente:
 * 1. Cria no Clerk com senha temporária
 * 2. Define role "client" no publicMetadata
 * 3. Salva no banco vinculado à empresa
 */
export async function createClientUser(formData: FormData) {
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const companyId = formData.get("companyId") as string

    if (!name || !email || !password || !companyId) {
        return { error: "Preencha todos os campos." }
    }

    try {
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
    } catch (err: any) {
        // Trata erros do Clerk (ex: e-mail já existe)
        const msg = err?.errors?.[0]?.longMessage ?? err?.message ?? "Erro ao criar usuário."
        return { error: msg }
    }
}

/**
 * Remove o acesso do cliente:
 * 1. Deleta o usuário no Clerk
 * 2. Remove o registro do banco
 */
export async function deleteClientUser(clientUserId: string, clerkId: string) {
    try {
        const clerk = await clerkClient()
        await clerk.users.deleteUser(clerkId)
    } catch {
        // Se já não existe no Clerk, continua e remove do banco
    }

    await prisma.clientUser.delete({ where: { id: clientUserId } })
    revalidatePath("/settings/clients")
    return { success: true }
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
    if (!name || !email) return { error: "Nome e e-mail são obrigatórios." }

    try {
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
            const newEmail = await clerk.emailAddresses.createEmailAddress({
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
    } catch (err: any) {
        const msg = err?.errors?.[0]?.longMessage ?? err?.message ?? "Erro ao atualizar."
        return { error: msg }
    }
}


export async function updateClientCompany(clientUserId: string, companyId: string) {
    await prisma.clientUser.update({
        where: { id: clientUserId },
        data: { companyId },
    })
    revalidatePath("/settings/clients")
    return { success: true }
}