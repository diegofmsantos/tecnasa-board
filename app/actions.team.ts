"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { clerkClient } from "@clerk/nextjs/server"
import { requireAdmin, toActionError } from "@/lib/auth"
import { createTeamMemberSchema, userRoleSchema, formatZodError } from "@/lib/validations"

export async function createTeamMember(formData: FormData) {
    try {
        await requireAdmin()
        const parsed = createTeamMemberSchema.safeParse({
            name: formData.get("name"),
            email: formData.get("email"),
            password: formData.get("password"),
            role: formData.get("role") || undefined,
        })
        if (!parsed.success) return { error: formatZodError(parsed.error) }
        const { name, email, password, role } = parsed.data

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
                role: role ?? "CONSULTOR",
            },
        })

        revalidatePath("/settings/team")
        return { success: true }
    } catch (err) {
        return toActionError(err, "Erro ao criar membro.")
    }
}

export async function deleteTeamMember(userId: string, clerkId: string) {
    try {
        await requireAdmin()

        try {
            const clerk = await clerkClient()
            await clerk.users.deleteUser(clerkId)
        } catch { }

        await prisma.user.delete({ where: { id: userId } })
        revalidatePath("/settings/team")
        return { success: true }
    } catch (err) {
        return toActionError(err, "Erro ao remover membro.")
    }
}

export async function updateTeamMemberRole(userId: string, role: string) {
    try {
        await requireAdmin()
        const parsedRole = userRoleSchema.safeParse(role)
        if (!parsedRole.success) return { error: "Papel inválido." }

        await prisma.user.update({ where: { id: userId }, data: { role: parsedRole.data } })
        revalidatePath("/settings/team")
        return { success: true }
    } catch (err) {
        return toActionError(err, "Erro ao atualizar papel do membro.")
    }
}
