"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs"

export async function createCompany(formData: FormData) {
  const name = formData.get("name") as string;

  if (!name) return;

  await prisma.company.create({
    data: { name }
  });

  revalidatePath("/");
}

export async function registerUser(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!name || !email || !password) {
    return { error: "Preencha todos os campos." };
  }

  // Verifica se o e-mail já existe no banco para evitar duplicidade
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return { error: "Este e-mail já está em uso." };
  }

  // Criptografa a senha (força 10)
  const hashedPassword = await bcrypt.hash(password, 10);

  // Salva no banco
  await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    }
  });

  return { success: true };
}

// 1. Criar Setor
export async function createSector(formData: FormData) {
  const name = formData.get("name") as string;
  const companyId = formData.get("companyId") as string;

  if (!name || !companyId) return;

  await prisma.sector.create({
    data: { name, companyId }
  });

  revalidatePath(`/company/${companyId}`);
}

// 2. Criar Processo (Antigo createProject)
export async function createProcess(formData: FormData) {
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const sectorId = formData.get("sectorId") as string;

  if (!title || !sectorId) return;

  await prisma.process.create({
    data: { title, description, sectorId }
  });

  revalidatePath(`/sector/${sectorId}`);
}

// Criar Tarefa (Corrigido de projectId para processId)
export async function createTask(formData: FormData) {
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const processId = formData.get("processId") as string;
  const userId = formData.get("userId") as string;
  const priority = formData.get("priority") as string;
  const dueDate = formData.get("dueDate") as string;

  if (!title || !processId) return;

  await prisma.task.create({
    data: {
      title,
      description,
      processId,
      priority: priority || "MEDIUM",
      dueDate: dueDate ? new Date(dueDate) : null,
      userId: userId !== "unassigned" ? userId : null,
    }
  });

  revalidatePath(`/process/${processId}`);
}

// Atualizar Status da Tarefa (Corrigido para processId)
export async function updateTaskStatus(taskId: string, newStatus: string, processId: string) {
  await prisma.task.update({
    where: { id: taskId },
    data: { status: newStatus }
  });

  revalidatePath(`/process/${processId}`);
}

// Deletar Tarefa (Corrigido para processId)
export async function deleteTask(taskId: string, processId: string) {
  await prisma.task.delete({
    where: { id: taskId }
  });

  revalidatePath(`/process/${processId}`);
}

// Atualização em tempo real das células do Planner (Inline Edit)
export async function updateTaskInline(taskId: string, field: string, value: string | null, companyId: string) {

  // Tratamento especial para datas
  let dataValue: any = value;
  if ((field === "startDate" || field === "dueDate") && value) {
    dataValue = new Date(value);
  }

  await prisma.task.update({
    where: { id: taskId },
    data: { [field]: dataValue }
  });

  // Atualiza a página da empresa instantaneamente
  revalidatePath(`/company/${companyId}`);
}

// 1. Apagar uma Atividade da Tabela
export async function deletePlannerTask(taskId: string, companyId: string) {
  await prisma.task.delete({ where: { id: taskId } });
  revalidatePath(`/company/${companyId}`);
}

// 2. Mudar o nome do Projeto (Antigo Setor)
export async function updateSectorName(sectorId: string, newName: string, companyId: string) {
  if (!newName) return;
  await prisma.sector.update({ where: { id: sectorId }, data: { name: newName } });
  revalidatePath(`/company/${companyId}`);
}

// 3. Criar uma Nova Etapa (Processo) vazia instantaneamente
export async function createPlannerProcess(sectorId: string, companyId: string) {
  await prisma.process.create({
    data: { title: "Nova Etapa (Renomeie)", sectorId }
  });
  revalidatePath(`/company/${companyId}`);
}

// 4. Criar uma Nova Atividade vazia instantaneamente na Tabela
export async function createPlannerTask(processId: string, companyId: string) {
  await prisma.task.create({
    data: { title: "Nova Atividade...", processId, status: "TODO" }
  });
  revalidatePath(`/company/${companyId}`);
}

// 5. Renomear a Etapa (Processo)
export async function updateProcessName(processId: string, newTitle: string, companyId: string) {
  if (!newTitle) return;
  await prisma.process.update({ where: { id: processId }, data: { title: newTitle } });
  revalidatePath(`/company/${companyId}`);
}

// 6. Excluir uma Etapa inteira (e todas as tarefas dentro dela)
export async function deletePlannerProcess(processId: string, companyId: string) {
  await prisma.process.delete({ where: { id: processId } });
  revalidatePath(`/company/${companyId}`);
}

// --- MÓDULO CRM (ATUALIZADO) ---

export async function createLead(formData: FormData) {
  const name = formData.get("name") as string;
  const cnpj = formData.get("cnpj") as string;
  const contactRole = formData.get("contactRole") as string;
  const segment = formData.get("segment") as string;
  const address = formData.get("address") as string;

  if (!name) return;

  await prisma.lead.create({
    // O novo status inicial do funil é "LEADS"
    data: { name, cnpj, contactRole, segment, address, status: "LEADS" }
  });
  revalidatePath("/crm");
}

export async function addInteraction(formData: FormData) {
  const leadId = formData.get("leadId") as string;
  const content = formData.get("content") as string;

  if (!leadId || !content) return;

  await prisma.interaction.create({
    data: { leadId, content }
  });
  revalidatePath(`/crm/${leadId}`);
}

// Nova função para mover o card no Kanban do CRM
export async function updateLeadStatus(leadId: string, newStatus: string) {
  await prisma.lead.update({
    where: { id: leadId },
    data: { status: newStatus }
  });
  revalidatePath("/crm");
}

// Função de Efetivação ajustada para o funil
export async function convertLeadToCompany(leadId: string, companyName: string) {
  // 1. Cria a Empresa no Painel Operacional
  const company = await prisma.company.create({
    data: { name: companyName }
  });

  // 2. Atualiza o Lead para a etapa de "Ganho"
  await prisma.lead.update({
    where: { id: leadId },
    data: { status: "GANHO" }
  });

  // 3. Redireciona direto para iniciar o projeto
  redirect(`/company/${company.id}`);
}