import { z } from "zod"

// Mantidos como listas de valores (em vez de importar os enums do Prisma Client)
// para que a validação de entrada não dependa da geração do client.
export const taskStatusValues = ["TODO", "IN_PROGRESS", "DONE"] as const
export const taskPriorityValues = ["LOW", "MEDIUM", "HIGH"] as const
export const companyStatusValues = [
  "EM_DIAGNOSTICO",
  "EM_MAPEAMENTO",
  "EM_IMPLEMENTACAO",
  "EM_MANUTENCAO",
  "CONCLUIDO",
  "PAUSADO",
] as const
// PROSPECT e LEADS representam a mesma coluna ("Leads") no funil do CRM.
export const leadStatusValues = [
  "PROSPECT",
  "LEADS",
  "DIAGNOSTICO",
  "PROPOSTA",
  "FECHAMENTO",
  "GANHO",
  "PERDIDO",
] as const
export const userRoleValues = ["ADMIN", "CONSULTOR"] as const
export const notificationTypeValues = ["INFO", "WARNING", "DANGER"] as const

export const taskStatusSchema = z.enum(taskStatusValues)
export const taskPrioritySchema = z.enum(taskPriorityValues)
export const companyStatusSchema = z.enum(companyStatusValues)
export const leadStatusSchema = z.enum(leadStatusValues)
export const userRoleSchema = z.enum(userRoleValues)

const requiredString = (max: number, label: string) =>
  z.string().trim().min(1, `${label} é obrigatório.`).max(max, `${label} muito longo.`)
const optionalString = (max: number) =>
  z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : v),
    z.string().trim().max(max).optional()
  )

export const createCompanySchema = z.object({
  name: requiredString(200, "Nome"),
})

export const createSectorSchema = z.object({
  name: requiredString(200, "Nome do setor"),
  companyId: requiredString(100, "Empresa"),
})

export const createProcessSchema = z.object({
  title: requiredString(200, "Título"),
  description: optionalString(2000),
  sectorId: requiredString(100, "Setor"),
})

export const createTaskSchema = z.object({
  title: requiredString(300, "Título"),
  description: optionalString(5000),
  processId: requiredString(100, "Processo"),
  userId: optionalString(100),
  priority: taskPrioritySchema.optional(),
  dueDate: optionalString(40),
})

export const updateCompanyInfoSchema = z.object({
  companyId: requiredString(100, "Empresa"),
  name: optionalString(200),
  logoUrl: optionalString(2000),
  cnpj: optionalString(30),
  segment: optionalString(150),
  contactName: optionalString(200),
  contactEmail: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.string().trim().email("E-mail de contato inválido.").max(200).optional()
  ),
  contactPhone: optionalString(40),
  address: optionalString(300),
  website: optionalString(300),
  notes: optionalString(5000),
})

export const createDeliverableSchema = z.object({
  companyId: requiredString(100, "Empresa"),
  name: requiredString(200, "Nome"),
  type: optionalString(100),
  url: requiredString(2000, "URL").url("Informe uma URL válida."),
  notes: optionalString(2000),
})

export const createLeadSchema = z.object({
  name: requiredString(200, "Nome"),
  cnpj: optionalString(30),
  contactRole: optionalString(150),
  segment: optionalString(150),
  address: optionalString(300),
})

export const addInteractionSchema = z.object({
  leadId: requiredString(100, "Prospecto"),
  content: requiredString(4000, "Conteúdo"),
})

export const createTeamMemberSchema = z.object({
  name: requiredString(200, "Nome"),
  email: z.string().trim().email("E-mail inválido.").max(200),
  password: z.string().min(8, "A senha deve ter ao menos 8 caracteres.").max(200),
  role: userRoleSchema.optional(),
})

export const createClientUserSchema = z.object({
  name: requiredString(200, "Nome"),
  email: z.string().trim().email("E-mail inválido.").max(200),
  password: z.string().min(8, "A senha deve ter ao menos 8 caracteres.").max(200),
  companyId: requiredString(100, "Empresa"),
})

export const createDeliverableTypeSchema = z.object({
  label: requiredString(80, "Nome"),
  color: requiredString(120, "Cor"),
})

/** Junta as mensagens de um ZodError em uma única string amigável. */
export function formatZodError(error: z.ZodError): string {
  return error.issues.map((issue) => issue.message).join(" ")
}
