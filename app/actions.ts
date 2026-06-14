"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { logActivity } from "@/lib/log-activity"

export async function createCompany(formData: FormData) {
  const name = formData.get("name") as string
  if (!name) return

  const company = await prisma.company.create({ data: { name } })

  await logActivity({
    action: "CREATED",
    entity: "COMPANY",
    entityId: company.id,
    description: `Empresa "${company.name}" cadastrada`,
    companyId: company.id,
  })

  revalidatePath("/")
}

// 1. Criar Setor
export async function createSector(formData: FormData) {
  const name = formData.get("name") as string
  const companyId = formData.get("companyId") as string
  if (!name || !companyId) return

  const sector = await prisma.sector.create({ data: { name, companyId } })

  await logActivity({
    action: "CREATED",
    entity: "SECTOR",
    entityId: sector.id,
    description: `Setor "${sector.name}" criado`,
    companyId,
  })

  revalidatePath(`/company/${companyId}`)
}

export async function deletePlannerSector(sectorId: string, companyId: string) {
  const sector = await prisma.sector.findUnique({ where: { id: sectorId } })

  await prisma.sector.delete({ where: { id: sectorId } })

  await logActivity({
    action: "DELETED",
    entity: "SECTOR",
    entityId: sectorId,
    description: `Setor "${sector?.name ?? sectorId}" removido`,
    companyId,
  })

  revalidatePath(`/company/${companyId}`)
}

// 2. Criar Processo
export async function createProcess(formData: FormData) {
  const title = formData.get("title") as string
  const description = formData.get("description") as string
  const sectorId = formData.get("sectorId") as string
  if (!title || !sectorId) return

  await prisma.process.create({ data: { title, description, sectorId } })
  revalidatePath(`/sector/${sectorId}`)
}

// Criar Tarefa
export async function createTask(formData: FormData) {
  const title = formData.get("title") as string
  const description = formData.get("description") as string
  const processId = formData.get("processId") as string
  const userId = formData.get("userId") as string
  const priority = formData.get("priority") as string
  const dueDate = formData.get("dueDate") as string
  if (!title || !processId) return

  await prisma.task.create({
    data: {
      title,
      description,
      processId,
      priority: priority || "MEDIUM",
      dueDate: dueDate ? new Date(dueDate) : null,
      userId: userId !== "unassigned" ? userId : null,
    }
  })

  revalidatePath(`/process/${processId}`)
}

// Atualizar Status da Tarefa
export async function updateTaskStatus(taskId: string, newStatus: string, processId: string) {
  await prisma.task.update({ where: { id: taskId }, data: { status: newStatus } })
  revalidatePath(`/process/${processId}`)
}

// Deletar Tarefa
export async function deleteTask(taskId: string, processId: string) {
  await prisma.task.delete({ where: { id: taskId } })
  revalidatePath(`/process/${processId}`)
}

// Atualização inline das células do Planner
export async function updateTaskInline(taskId: string, field: string, value: string | null, companyId: string) {
  let dataValue: any = value
  if ((field === "startDate" || field === "dueDate") && value) {
    dataValue = new Date(value)
  }

  const task = await prisma.task.update({
    where: { id: taskId },
    data: { [field]: dataValue },
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
    })
  }

  revalidatePath(`/company/${companyId}`)
}

// 1. Apagar uma Atividade da Tabela
export async function deletePlannerTask(taskId: string, companyId: string) {
  const task = await prisma.task.findUnique({ where: { id: taskId } })

  await prisma.task.delete({ where: { id: taskId } })

  await logActivity({
    action: "DELETED",
    entity: "TASK",
    entityId: taskId,
    description: `Tarefa "${task?.title ?? taskId}" removida`,
    companyId,
  })

  revalidatePath(`/company/${companyId}`)
}

// 2. Renomear Setor
export async function updateSectorName(sectorId: string, newName: string, companyId: string) {
  if (!newName) return
  await prisma.sector.update({ where: { id: sectorId }, data: { name: newName } })

  await logActivity({
    action: "UPDATED",
    entity: "SECTOR",
    entityId: sectorId,
    description: `Setor renomeado para "${newName}"`,
    companyId,
  })

  revalidatePath(`/company/${companyId}`)
}

// 3. Criar Nova Etapa (Processo) vazia
export async function createPlannerProcess(sectorId: string, companyId: string) {
  const process = await prisma.process.create({
    data: { title: "Nova Etapa (Renomeie)", sectorId }
  })

  await logActivity({
    action: "CREATED",
    entity: "PROCESS",
    entityId: process.id,
    description: `Etapa "${process.title}" criada`,
    companyId,
  })

  revalidatePath(`/company/${companyId}`)
}

// 4. Criar Nova Atividade vazia na Tabela
export async function createPlannerTask(processId: string, companyId: string) {
  const task = await prisma.task.create({
    data: { title: "Nova Atividade...", processId, status: "TODO" }
  })

  await logActivity({
    action: "CREATED",
    entity: "TASK",
    entityId: task.id,
    description: `Tarefa "${task.title}" criada`,
    companyId,
  })

  revalidatePath(`/company/${companyId}`)
}

// 5. Renomear Etapa (Processo)
export async function updateProcessName(processId: string, newTitle: string, companyId: string) {
  if (!newTitle) return
  await prisma.process.update({ where: { id: processId }, data: { title: newTitle } })

  await logActivity({
    action: "UPDATED",
    entity: "PROCESS",
    entityId: processId,
    description: `Etapa renomeada para "${newTitle}"`,
    companyId,
  })

  revalidatePath(`/company/${companyId}`)
}

// 6. Excluir Etapa inteira
export async function deletePlannerProcess(processId: string, companyId: string) {
  const process = await prisma.process.findUnique({ where: { id: processId } })

  await prisma.process.delete({ where: { id: processId } })

  await logActivity({
    action: "DELETED",
    entity: "PROCESS",
    entityId: processId,
    description: `Etapa "${process?.title ?? processId}" removida`,
    companyId,
  })

  revalidatePath(`/company/${companyId}`)
}

// --- MÓDULO CRM ---

export async function createLead(formData: FormData) {
  const name = formData.get("name") as string
  const cnpj = formData.get("cnpj") as string
  const contactRole = formData.get("contactRole") as string
  const segment = formData.get("segment") as string
  const address = formData.get("address") as string
  if (!name) return

  const lead = await prisma.lead.create({
    data: { name, cnpj, contactRole, segment, address, status: "LEADS" }
  })

  await logActivity({
    action: "CREATED",
    entity: "COMPANY",
    entityId: lead.id,
    description: `Prospecto "${lead.name}" adicionado ao CRM`,
  })

  revalidatePath("/crm")
}

export async function addInteraction(formData: FormData) {
  const leadId = formData.get("leadId") as string
  const content = formData.get("content") as string
  if (!leadId || !content) return

  await prisma.interaction.create({ data: { leadId, content } })
  revalidatePath(`/crm/${leadId}`)
}

export async function updateLeadStatus(leadId: string, newStatus: string) {
  await prisma.lead.update({ where: { id: leadId }, data: { status: newStatus } })
  revalidatePath("/crm")
}

export async function convertLeadToCompany(leadId: string, companyName: string) {
  const company = await prisma.company.create({ data: { name: companyName } })

  await prisma.lead.update({ where: { id: leadId }, data: { status: "GANHO" } })

  await logActivity({
    action: "CREATED",
    entity: "COMPANY",
    entityId: company.id,
    description: `Lead "${companyName}" convertido em cliente`,
    companyId: company.id,
  })

  redirect(`/company/${company.id}`)
}

export async function deleteLead(leadId: string) {
  await prisma.lead.delete({ where: { id: leadId } })
  revalidatePath("/crm")
}