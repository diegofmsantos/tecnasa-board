"use server"

import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { logActivity } from "@/lib/log-activity"
import { requireInternalUser, toActionError } from "@/lib/auth"
import {
  createCompanySchema,
  createSectorSchema,
  createProcessSchema,
  createTaskSchema,
  createLeadSchema,
  addInteractionSchema,
  taskStatusSchema,
  leadStatusSchema,
  formatZodError,
} from "@/lib/validations"

export async function createCompany(formData: FormData) {
  try {
    await requireInternalUser()
    const parsed = createCompanySchema.safeParse({ name: formData.get("name") })
    if (!parsed.success) return { error: formatZodError(parsed.error) }

    const company = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({ data: { name: parsed.data.name } })
      await logActivity({
        action: "CREATED",
        entity: "COMPANY",
        entityId: company.id,
        description: `Empresa "${company.name}" cadastrada`,
        companyId: company.id,
      }, tx)
      return company
    })

    revalidatePath("/")
    return { success: true, company }
  } catch (err) {
    return toActionError(err, "Erro ao cadastrar empresa.")
  }
}

// 1. Criar Setor
export async function createSector(formData: FormData) {
  try {
    await requireInternalUser()
    const parsed = createSectorSchema.safeParse({
      name: formData.get("name"),
      companyId: formData.get("companyId"),
    })
    if (!parsed.success) return { error: formatZodError(parsed.error) }
    const { name, companyId } = parsed.data

    await prisma.$transaction(async (tx) => {
      const sector = await tx.sector.create({ data: { name, companyId } })
      await logActivity({
        action: "CREATED",
        entity: "SECTOR",
        entityId: sector.id,
        description: `Setor "${sector.name}" criado`,
        companyId,
      }, tx)
    })

    revalidatePath(`/company/${companyId}`)
    return { success: true }
  } catch (err) {
    return toActionError(err, "Erro ao criar setor.")
  }
}

export async function deletePlannerSector(sectorId: string, companyId: string) {
  try {
    await requireInternalUser()

    await prisma.$transaction(async (tx) => {
      const sector = await tx.sector.findUnique({ where: { id: sectorId } })
      await tx.sector.delete({ where: { id: sectorId } })
      await logActivity({
        action: "DELETED",
        entity: "SECTOR",
        entityId: sectorId,
        description: `Setor "${sector?.name ?? sectorId}" removido`,
        companyId,
      }, tx)
    })

    revalidatePath(`/company/${companyId}`)
    return { success: true }
  } catch (err) {
    return toActionError(err, "Erro ao remover setor.")
  }
}

// 2. Criar Processo
export async function createProcess(formData: FormData) {
  try {
    await requireInternalUser()
    const parsed = createProcessSchema.safeParse({
      title: formData.get("title"),
      description: formData.get("description"),
      sectorId: formData.get("sectorId"),
    })
    if (!parsed.success) return { error: formatZodError(parsed.error) }
    const { title, description, sectorId } = parsed.data

    await prisma.process.create({ data: { title, description, sectorId } })
    revalidatePath(`/sector/${sectorId}`)
    return { success: true }
  } catch (err) {
    return toActionError(err, "Erro ao criar processo.")
  }
}

// Criar Tarefa
export async function createTask(formData: FormData) {
  try {
    await requireInternalUser()
    const parsed = createTaskSchema.safeParse({
      title: formData.get("title"),
      description: formData.get("description"),
      processId: formData.get("processId"),
      userId: formData.get("userId"),
      priority: formData.get("priority") || undefined,
      dueDate: formData.get("dueDate"),
    })
    if (!parsed.success) return { error: formatZodError(parsed.error) }
    const { title, description, processId, userId, priority, dueDate } = parsed.data

    await prisma.task.create({
      data: {
        title,
        description,
        processId,
        priority: priority ?? "MEDIUM",
        dueDate: dueDate ? new Date(dueDate) : null,
        userId: userId && userId !== "unassigned" ? userId : null,
      }
    })

    revalidatePath(`/process/${processId}`)
    return { success: true }
  } catch (err) {
    return toActionError(err, "Erro ao criar tarefa.")
  }
}

// Deletar Tarefa
export async function deleteTask(taskId: string, processId: string) {
  try {
    await requireInternalUser()
    await prisma.task.delete({ where: { id: taskId } })
    revalidatePath(`/process/${processId}`)
    return { success: true }
  } catch (err) {
    return toActionError(err, "Erro ao remover tarefa.")
  }
}

const INLINE_FIELDS = new Set([
  "title", "description", "status", "priority", "startDate", "dueDate", "notes", "driveLink", "userId",
])

// Atualização inline das células do Planner
export async function updateTaskInline(taskId: string, field: string, value: string | null, companyId: string) {
  try {
    await requireInternalUser()
    if (!INLINE_FIELDS.has(field)) return { error: "Campo inválido." }

    let dataValue: string | Date | null = value
    if ((field === "startDate" || field === "dueDate") && value) {
      dataValue = new Date(value)
    }
    if (field === "status" && value) {
      dataValue = taskStatusSchema.parse(value)
    }

    // Campo dinâmico, restrito à allowlist INLINE_FIELDS acima — não há um
    // tipo de update estático possível aqui, por isso o cast pontual.
    const updateData = { [field]: dataValue } as Prisma.TaskUpdateInput

    const task = await prisma.$transaction(async (tx) => {
      const task = await tx.task.update({
        where: { id: taskId },
        data: updateData,
      })

      // Loga apenas mudança de status (evita log a cada keystroke)
      if (field === "status") {
        const statusLabel: Record<string, string> = {
          TODO: "Novo",
          IN_PROGRESS: "Em Andamento",
          DONE: "Concluído",
        }
        await logActivity({
          action: "STATUS_CHANGED",
          entity: "TASK",
          entityId: taskId,
          description: `Status de "${task.title}" alterado para ${statusLabel[value ?? ""] ?? value}`,
          companyId,
        }, tx)
      }

      return task
    })

    revalidatePath(`/company/${companyId}`)
    return { success: true, task }
  } catch (err) {
    return toActionError(err, "Erro ao atualizar tarefa.")
  }
}

// 1. Apagar uma Atividade da Tabela
export async function deletePlannerTask(taskId: string, companyId: string) {
  try {
    await requireInternalUser()

    await prisma.$transaction(async (tx) => {
      const task = await tx.task.findUnique({ where: { id: taskId } })
      await tx.task.delete({ where: { id: taskId } })
      await logActivity({
        action: "DELETED",
        entity: "TASK",
        entityId: taskId,
        description: `Tarefa "${task?.title ?? taskId}" removida`,
        companyId,
      }, tx)
    })

    revalidatePath(`/company/${companyId}`)
    return { success: true }
  } catch (err) {
    return toActionError(err, "Erro ao remover tarefa.")
  }
}

// 2. Renomear Setor
export async function updateSectorName(sectorId: string, newName: string, companyId: string) {
  try {
    await requireInternalUser()
    const name = newName?.trim()
    if (!name) return { error: "Nome não pode ficar vazio." }

    await prisma.$transaction(async (tx) => {
      await tx.sector.update({ where: { id: sectorId }, data: { name } })
      await logActivity({
        action: "UPDATED",
        entity: "SECTOR",
        entityId: sectorId,
        description: `Setor renomeado para "${name}"`,
        companyId,
      }, tx)
    })

    revalidatePath(`/company/${companyId}`)
    return { success: true }
  } catch (err) {
    return toActionError(err, "Erro ao renomear setor.")
  }
}

// 3. Criar Nova Etapa (Processo) vazia
export async function createPlannerProcess(sectorId: string, companyId: string) {
  try {
    await requireInternalUser()

    await prisma.$transaction(async (tx) => {
      const process = await tx.process.create({
        data: { title: "Nova Etapa (Renomeie)", sectorId }
      })
      await logActivity({
        action: "CREATED",
        entity: "PROCESS",
        entityId: process.id,
        description: `Etapa "${process.title}" criada`,
        companyId,
      }, tx)
    })

    revalidatePath(`/company/${companyId}`)
    return { success: true }
  } catch (err) {
    return toActionError(err, "Erro ao criar etapa.")
  }
}

// 4. Criar Nova Atividade vazia na Tabela
export async function createPlannerTask(processId: string, companyId: string) {
  try {
    await requireInternalUser()

    await prisma.$transaction(async (tx) => {
      const task = await tx.task.create({
        data: { title: "Nova Atividade...", processId, status: "TODO" }
      })
      await logActivity({
        action: "CREATED",
        entity: "TASK",
        entityId: task.id,
        description: `Tarefa "${task.title}" criada`,
        companyId,
      }, tx)
    })

    revalidatePath(`/company/${companyId}`)
    return { success: true }
  } catch (err) {
    return toActionError(err, "Erro ao criar atividade.")
  }
}

// 5. Renomear Etapa (Processo)
export async function updateProcessName(processId: string, newTitle: string, companyId: string) {
  try {
    await requireInternalUser()
    const title = newTitle?.trim()
    if (!title) return { error: "Título não pode ficar vazio." }

    await prisma.$transaction(async (tx) => {
      await tx.process.update({ where: { id: processId }, data: { title } })
      await logActivity({
        action: "UPDATED",
        entity: "PROCESS",
        entityId: processId,
        description: `Etapa renomeada para "${title}"`,
        companyId,
      }, tx)
    })

    revalidatePath(`/company/${companyId}`)
    return { success: true }
  } catch (err) {
    return toActionError(err, "Erro ao renomear etapa.")
  }
}

// 6. Excluir Etapa inteira
export async function deletePlannerProcess(processId: string, companyId: string) {
  try {
    await requireInternalUser()

    await prisma.$transaction(async (tx) => {
      const process = await tx.process.findUnique({ where: { id: processId } })
      await tx.process.delete({ where: { id: processId } })
      await logActivity({
        action: "DELETED",
        entity: "PROCESS",
        entityId: processId,
        description: `Etapa "${process?.title ?? processId}" removida`,
        companyId,
      }, tx)
    })

    revalidatePath(`/company/${companyId}`)
    return { success: true }
  } catch (err) {
    return toActionError(err, "Erro ao remover etapa.")
  }
}

// --- MÓDULO CRM ---

export async function createLead(formData: FormData) {
  try {
    await requireInternalUser()
    const parsed = createLeadSchema.safeParse({
      name: formData.get("name"),
      cnpj: formData.get("cnpj"),
      contactRole: formData.get("contactRole"),
      segment: formData.get("segment"),
      address: formData.get("address"),
    })
    if (!parsed.success) return { error: formatZodError(parsed.error) }
    const { name, cnpj, contactRole, segment, address } = parsed.data

    await prisma.$transaction(async (tx) => {
      const lead = await tx.lead.create({
        data: { name, cnpj, contactRole, segment, address, status: "LEADS" }
      })
      await logActivity({
        action: "CREATED",
        entity: "COMPANY",
        entityId: lead.id,
        description: `Prospecto "${lead.name}" adicionado ao CRM`,
      }, tx)
    })

    revalidatePath("/crm")
    return { success: true }
  } catch (err) {
    return toActionError(err, "Erro ao adicionar prospecto.")
  }
}

export async function addInteraction(formData: FormData) {
  try {
    await requireInternalUser()
    const parsed = addInteractionSchema.safeParse({
      leadId: formData.get("leadId"),
      content: formData.get("content"),
    })
    if (!parsed.success) return { error: formatZodError(parsed.error) }
    const { leadId, content } = parsed.data

    await prisma.interaction.create({ data: { leadId, content } })
    revalidatePath(`/crm/${leadId}`)
    return { success: true }
  } catch (err) {
    return toActionError(err, "Erro ao registrar interação.")
  }
}

export async function updateLeadStatus(leadId: string, newStatus: string) {
  try {
    await requireInternalUser()
    const parsed = leadStatusSchema.safeParse(newStatus)
    if (!parsed.success) return { error: "Status inválido." }

    await prisma.lead.update({ where: { id: leadId }, data: { status: parsed.data } })
    revalidatePath("/crm")
    return { success: true }
  } catch (err) {
    return toActionError(err, "Erro ao mover prospecto.")
  }
}

export async function convertLeadToCompany(leadId: string, companyName: string) {
  const result = await (async () => {
    try {
      await requireInternalUser()
      const name = companyName?.trim()
      if (!name) return { ok: false as const, error: "Nome da empresa é obrigatório." }

      const companyId = await prisma.$transaction(async (tx) => {
        const company = await tx.company.create({ data: { name } })
        await tx.lead.update({ where: { id: leadId }, data: { status: "GANHO" } })
        await logActivity({
          action: "CREATED",
          entity: "COMPANY",
          entityId: company.id,
          description: `Lead "${name}" convertido em cliente`,
          companyId: company.id,
        }, tx)
        return company.id
      })

      return { ok: true as const, companyId }
    } catch (err) {
      return { ok: false as const, error: toActionError(err, "Erro ao converter prospecto.").error }
    }
  })()

  if (!result.ok) return { error: result.error }
  redirect(`/company/${result.companyId}`)
}

export async function deleteLead(leadId: string) {
  try {
    await requireInternalUser()
    await prisma.lead.delete({ where: { id: leadId } })
    revalidatePath("/crm")
    return { success: true }
  } catch (err) {
    return toActionError(err, "Erro ao remover prospecto.")
  }
}
