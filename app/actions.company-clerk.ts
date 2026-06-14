"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@clerk/nextjs/server"

export async function updateCompanyInfo(formData: FormData) {
  const companyId = formData.get("companyId") as string
  if (!companyId) return { error: "ID da empresa não informado." }

  const data = {
    name: (formData.get("name") as string) || undefined,
    logoUrl: (formData.get("logoUrl") as string) || null,
    cnpj: (formData.get("cnpj") as string) || null,
    segment: (formData.get("segment") as string) || null,
    contactName: (formData.get("contactName") as string) || null,
    contactEmail: (formData.get("contactEmail") as string) || null,
    contactPhone: (formData.get("contactPhone") as string) || null,
    address: (formData.get("address") as string) || null,
    website: (formData.get("website") as string) || null,
    notes: (formData.get("notes") as string) || null,
  }

  await prisma.company.update({ where: { id: companyId }, data })
  revalidatePath(`/company/${companyId}`)
  return { success: true }
}

export async function updateCompanyStatus(companyId: string, status: string) {
  if (!companyId || !status) return { error: "Dados inválidos." }
  await prisma.company.update({ where: { id: companyId }, data: { status } })
  revalidatePath(`/company/${companyId}`)
  revalidatePath("/")
  return { success: true }
}

export async function createDeliverable(formData: FormData) {
  const companyId = formData.get("companyId") as string
  const name = formData.get("name") as string
  const type = formData.get("type") as string
  const url = formData.get("url") as string
  const notes = formData.get("notes") as string

  if (!companyId || !name || !url) return { error: "Preencha os campos obrigatórios." }

  const { userId: clerkId } = await auth()
  const user = clerkId
    ? await prisma.user.findUnique({ where: { clerkId } })
    : null

  await prisma.deliverable.create({
    data: {
      companyId,
      name,
      type: type || "OUTRO",
      url,
      notes: notes || null,
      userId: user?.id ?? null,
    }
  })

  revalidatePath(`/company/${companyId}`)
  return { success: true }
}

export async function deleteDeliverable(deliverableId: string, companyId: string) {
  await prisma.deliverable.delete({ where: { id: deliverableId } })
  revalidatePath(`/company/${companyId}`)
}