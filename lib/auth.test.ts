import { describe, it, expect, vi, beforeEach } from "vitest"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { requireInternalUser, requireAdmin, toActionError, ActionError } from "./auth"

// lib/auth.ts é o portão de autorização de TODA Server Action do sistema —
// foi justamente a falta de checagem aqui que permitia, antes, qualquer
// usuário logado (inclusive de conta de cliente) chamar ações de exclusão.
// Por isso ele merece o teste mais cuidadoso do projeto.
//
// Como esse arquivo fala com o Clerk (autenticação) e com o Prisma (banco),
// e não queremos um teste que depende de internet ou de um banco real,
// "mockamos" as duas coisas: no lugar do código de verdade, entra uma versão
// falsa que a gente controla (vi.fn()) e programa pra devolver o que quisermos.
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
  },
}))

const mockedAuth = vi.mocked(auth)
const mockedFindUnique = vi.mocked(prisma.user.findUnique)

beforeEach(() => {
  vi.clearAllMocks()
})

describe("requireInternalUser", () => {
  it("lança erro quando não há ninguém logado", async () => {
    mockedAuth.mockResolvedValue({ userId: null, sessionClaims: null } as never)

    await expect(requireInternalUser()).rejects.toThrow(ActionError)
  })

  it("lança erro quando a sessão é de uma conta de cliente do portal", async () => {
    mockedAuth.mockResolvedValue({
      userId: "user_123",
      sessionClaims: { publicMetadata: { role: "client" } },
    } as never)

    await expect(requireInternalUser()).rejects.toThrow(/cliente/i)
    // e o mais importante: nem chega a consultar o banco
    expect(mockedFindUnique).not.toHaveBeenCalled()
  })

  it("lança erro quando o clerkId está logado mas não existe User correspondente no banco", async () => {
    mockedAuth.mockResolvedValue({ userId: "user_123", sessionClaims: {} } as never)
    mockedFindUnique.mockResolvedValue(null)

    await expect(requireInternalUser()).rejects.toThrow(/não encontrado/i)
  })

  it("retorna o usuário interno quando a sessão é válida", async () => {
    mockedAuth.mockResolvedValue({ userId: "user_123", sessionClaims: {} } as never)
    const fakeUser = { id: "u1", clerkId: "user_123", role: "CONSULTOR" as const }
    mockedFindUnique.mockResolvedValue(fakeUser as never)

    await expect(requireInternalUser()).resolves.toEqual(fakeUser)
  })
})

describe("requireAdmin", () => {
  it("lança erro quando o usuário logado é CONSULTOR, não ADMIN", async () => {
    mockedAuth.mockResolvedValue({ userId: "user_123", sessionClaims: {} } as never)
    mockedFindUnique.mockResolvedValue({ id: "u1", role: "CONSULTOR" } as never)

    await expect(requireAdmin()).rejects.toThrow(/administradores/i)
  })

  it("retorna o usuário quando o role é ADMIN", async () => {
    mockedAuth.mockResolvedValue({ userId: "user_123", sessionClaims: {} } as never)
    const adminUser = { id: "u1", role: "ADMIN" as const }
    mockedFindUnique.mockResolvedValue(adminUser as never)

    await expect(requireAdmin()).resolves.toEqual(adminUser)
  })
})

describe("toActionError", () => {
  it("preserva a mensagem de um ActionError conhecido", () => {
    expect(toActionError(new ActionError("mensagem específica para o usuário"))).toEqual({
      error: "mensagem específica para o usuário",
    })
  })

  it("esconde o erro real por trás de uma mensagem genérica quando não é um ActionError", () => {
    // erros inesperados (ex: falha de conexão com o banco) não devem vazar
    // detalhes internos para quem está usando o sistema
    vi.spyOn(console, "error").mockImplementation(() => {})

    const result = toActionError(new Error("connection refused at 10.0.0.5:5432"), "Erro ao salvar.")

    expect(result).toEqual({ error: "Erro ao salvar." })
  })
})
