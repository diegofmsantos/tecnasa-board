import { describe, it, expect } from "vitest"
import {
  createCompanySchema,
  createTaskSchema,
  updateCompanyInfoSchema,
  createDeliverableSchema,
  createLeadSchema,
  createTeamMemberSchema,
  createClientUserSchema,
  leadStatusSchema,
  taskStatusSchema,
  taskPrioritySchema,
  userRoleSchema,
  formatZodError,
} from "./validations"

describe("createCompanySchema", () => {
  it("aceita um nome válido", () => {
    expect(createCompanySchema.safeParse({ name: "Tecnasa" }).success).toBe(true)
  })

  it("rejeita nome vazio", () => {
    expect(createCompanySchema.safeParse({ name: "" }).success).toBe(false)
  })

  it("rejeita nome só com espaços", () => {
    expect(createCompanySchema.safeParse({ name: "   " }).success).toBe(false)
  })
})

describe("createTaskSchema", () => {
  it("exige título e processId", () => {
    expect(createTaskSchema.safeParse({}).success).toBe(false)
  })

  it("aceita uma tarefa válida sem os campos opcionais", () => {
    const result = createTaskSchema.safeParse({ title: "Tarefa", processId: "p1" })
    expect(result.success).toBe(true)
  })

  it("rejeita uma prioridade que não existe (ex: valor manipulado no formulário)", () => {
    const result = createTaskSchema.safeParse({
      title: "Tarefa",
      processId: "p1",
      priority: "URGENTE",
    })
    expect(result.success).toBe(false)
  })
})

describe("updateCompanyInfoSchema", () => {
  it("rejeita um e-mail de contato inválido", () => {
    const result = updateCompanyInfoSchema.safeParse({
      companyId: "c1",
      contactEmail: "não-é-um-email",
    })
    expect(result.success).toBe(false)
  })

  it("aceita e-mail de contato vazio (campo opcional)", () => {
    const result = updateCompanyInfoSchema.safeParse({ companyId: "c1", contactEmail: "" })
    expect(result.success).toBe(true)
  })

  it("exige o companyId", () => {
    expect(updateCompanyInfoSchema.safeParse({}).success).toBe(false)
  })
})

describe("createDeliverableSchema", () => {
  it("rejeita uma URL inválida", () => {
    const result = createDeliverableSchema.safeParse({
      companyId: "c1",
      name: "Contrato",
      url: "isso não é uma url",
    })
    expect(result.success).toBe(false)
  })

  it("aceita uma URL válida", () => {
    const result = createDeliverableSchema.safeParse({
      companyId: "c1",
      name: "Contrato",
      url: "https://exemplo.com/arquivo.pdf",
    })
    expect(result.success).toBe(true)
  })
})

describe("createLeadSchema", () => {
  it("só exige o nome, o resto é opcional", () => {
    expect(createLeadSchema.safeParse({ name: "Empresa X" }).success).toBe(true)
  })
})

describe("senhas de createTeamMemberSchema / createClientUserSchema", () => {
  it("rejeita senha com menos de 8 caracteres", () => {
    const result = createTeamMemberSchema.safeParse({
      name: "Fulano",
      email: "fulano@tecnasa.com.br",
      password: "1234567",
    })
    expect(result.success).toBe(false)
  })

  it("aceita senha com 8 ou mais caracteres", () => {
    const result = createClientUserSchema.safeParse({
      name: "Fulano",
      email: "fulano@empresa.com",
      password: "12345678",
      companyId: "c1",
    })
    expect(result.success).toBe(true)
  })

  it("rejeita e-mail inválido", () => {
    const result = createTeamMemberSchema.safeParse({
      name: "Fulano",
      email: "não-é-email",
      password: "12345678",
    })
    expect(result.success).toBe(false)
  })
})

// Estes 4 enums existem porque status/prioridade/role vêm de <select> no
// formulário — o navegador nunca deveria mandar um valor fora da lista, mas
// nada impede alguém de editar o HTML e mandar qualquer string. É essa
// barreira que estes testes garantem que continua de pé.
describe("enums recebidos de formulários (proteção contra valor manipulado)", () => {
  it("leadStatusSchema aceita todas as colunas do funil do CRM", () => {
    for (const status of ["PROSPECT", "LEADS", "DIAGNOSTICO", "PROPOSTA", "FECHAMENTO", "GANHO", "PERDIDO"]) {
      expect(leadStatusSchema.safeParse(status).success, status).toBe(true)
    }
  })

  it("leadStatusSchema rejeita um status fora do funil", () => {
    expect(leadStatusSchema.safeParse("QUALQUER_COISA").success).toBe(false)
  })

  it("taskStatusSchema aceita TODO, IN_PROGRESS e DONE", () => {
    for (const status of ["TODO", "IN_PROGRESS", "DONE"]) {
      expect(taskStatusSchema.safeParse(status).success, status).toBe(true)
    }
  })

  it("taskStatusSchema rejeita um status desconhecido", () => {
    expect(taskStatusSchema.safeParse("CANCELLED").success).toBe(false)
  })

  it("taskPrioritySchema aceita LOW, MEDIUM e HIGH", () => {
    for (const p of ["LOW", "MEDIUM", "HIGH"]) {
      expect(taskPrioritySchema.safeParse(p).success, p).toBe(true)
    }
  })

  it("userRoleSchema só aceita ADMIN ou CONSULTOR", () => {
    expect(userRoleSchema.safeParse("ADMIN").success).toBe(true)
    expect(userRoleSchema.safeParse("CONSULTOR").success).toBe(true)
    expect(userRoleSchema.safeParse("SUPERADMIN").success).toBe(false)
  })
})

describe("formatZodError", () => {
  it("junta as mensagens de erro em uma única string exibível", () => {
    const result = createCompanySchema.safeParse({ name: "" })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(formatZodError(result.error)).toContain("Nome")
    }
  })
})
