"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { clerkClient } from "@clerk/nextjs/server"

export async function createTeamMember(formData: FormData) {
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const role = formData.get("role") as string

    if (!name || !email || !password) return { error: "Preencha todos os campos." }

    try {
        const clerk = await clerkClient()

        const clerkUser = await clerk.users.createUser({
            firstName: name.split(" ")[0],
            lastName: name.split(" ").slice(1).join(" ") || undefined,
            emailAddress: [email],
            password,
            publicMetadata: { role: "internal" },
        })

        await prisma.user.create({
            data: {
                clerkId: clerkUser.id,
                name,
                email,
                role: role || "CONSULTOR",
            },
        })

        revalidatePath("/settings/team")
        return { success: true }
    } catch (err: any) {
        const msg = err?.errors?.[0]?.longMessage ?? err?.message ?? "Erro ao criar membro."
        return { error: msg }
    }
}

export async function deleteTeamMember(userId: string, clerkId: string) {
    try {
        const clerk = await clerkClient()
        await clerk.users.deleteUser(clerkId)
    } catch { }

    await prisma.user.delete({ where: { id: userId } })
    revalidatePath("/settings/team")
    return { success: true }
}

export async function updateTeamMemberRole(userId: string, role: string) {
    await prisma.user.update({ where: { id: userId }, data: { role } })
    revalidatePath("/settings/team")
    return { success: true }
}