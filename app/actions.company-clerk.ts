"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { requireInternalUser, toActionError } from "@/lib/auth"
import { updateCompanyInfoSchema, createDeliverableSchema, companyStatusSchema, formatZodError } from "@/lib/validations"

export async function updateCompanyInfo(formData: FormData) {
  try {
    await requireInternalUser()
    const parsed = updateCompanyInfoSchema.safeParse({
      companyId: formData.get("companyId"),
      name: formData.get("name"),
      logoUrl: formData.get("logoUrl"),
      cnpj: formData.get("cnpj"),
      segment: formData.get("segment"),
      contactName: formData.get("contactName"),
      contactEmail: formData.get("contactEmail"),
      contactPhone: formData.get("contactPhone"),
      address: formData.get("address"),
      website: formData.get("website"),
      notes: formData.get("notes"),
    })
    if (!parsed.success) return { error: formatZodError(parsed.error) }
    const { companyId, ...rest } = parsed.data

    const data = {
      name: rest.name,
      logoUrl: rest.logoUrl ?? null,
      cnpj: rest.cnpj ?? null,
      segment: rest.segment ?? null,
      contactName: rest.contactName ?? null,
      contactEmail: rest.contactEmail ?? null,
      contactPhone: rest.contactPhone ?? null,
      address: rest.address ?? null,
      website: rest.website ?? null,
      notes: rest.notes ?? null,
    }

    await prisma.company.update({ where: { id: companyId }, data })
    revalidatePath(`/company/${companyId}`)
    return { success: true }
  } catch (err) {
    return toActionError(err, "Erro ao atualizar dados da empresa.")
  }
}

export async function updateCompanyStatus(companyId: string, status: string) {
  try {
    await requireInternalUser()
    if (!companyId) return { error: "Empresa não informada." }
    const parsed = companyStatusSchema.safeParse(status)
    if (!parsed.success) return { error: "Status inválido." }

    await prisma.company.update({ where: { id: companyId }, data: { status: parsed.data } })
    revalidatePath(`/company/${companyId}`)
    revalidatePath("/")
    return { success: true }
  } catch (err) {
    return toActionError(err, "Erro ao atualizar status da empresa.")
  }
}

export async function createDeliverable(formData: FormData) {
  try {
    const user = await requireInternalUser()
    const parsed = createDeliverableSchema.safeParse({
      companyId: formData.get("companyId"),
      name: formData.get("name"),
      type: formData.get("type"),
      url: formData.get("url"),
      notes: formData.get("notes"),
    })
    if (!parsed.success) return { error: formatZodError(parsed.error) }
    const { companyId, name, type, url, notes } = parsed.data

    await prisma.deliverable.create({
      data: {
        companyId,
        name,
        type: type || "OUTRO",
        url,
        notes: notes ?? null,
        userId: user.id,
      }
    })

    revalidatePath(`/company/${companyId}`)
    return { success: true }
  } catch (err) {
    return toActionError(err, "Erro ao adicionar entregável.")
  }
}

export async function deleteDeliverable(deliverableId: string, companyId: string) {
  try {
    await requireInternalUser()
    await prisma.deliverable.delete({ where: { id: deliverableId } })
    revalidatePath(`/company/${companyId}`)
    return { success: true }
  } catch (err) {
    return toActionError(err, "Erro ao remover entregável.")
  }
}
