import { describe, it, expect, vi, beforeEach } from "vitest"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { updateCompanyStatus } from "./actions.company-clerk"

// Este arquivo serve de MODELO para testar as outras Server Actions do
// projeto: toda action segue o mesmo formato (autenticar → validar → mexer
// no banco → devolver {success} ou {error}), então o mesmo esqueleto de
// mocks serve para qualquer uma delas — troque só a action e as asserções.
//
// Só mockamos as duas coisas que realmente saem do nosso código: o Clerk
// (rede) e o Prisma (banco). A validação e a checagem de autorização
// (lib/auth.ts) rodam de verdade, então o teste também garante que elas
// continuam funcionando juntas.
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    company: { update: vi.fn() },
  },
}))

const mockedAuth = vi.mocked(auth)
const mockedUserFindUnique = vi.mocked(prisma.user.findUnique)
const mockedCompanyUpdate = vi.mocked(prisma.company.update)

beforeEach(() => {
  vi.clearAllMocks()
})

/** Simula um usuário interno (CONSULTOR) já logado, para os testes que precisam passar da autorização. */
function loginComoUsuarioInterno() {
  mockedAuth.mockResolvedValue({ userId: "clerk_1", sessionClaims: {} } as never)
  mockedUserFindUnique.mockResolvedValue({ id: "u1", role: "CONSULTOR" } as never)
}

describe("updateCompanyStatus", () => {
  it("recusa um usuário não autenticado sem tocar no banco", async () => {
    mockedAuth.mockResolvedValue({ userId: null, sessionClaims: null } as never)

    const result = await updateCompanyStatus("c1", "CONCLUIDO")

    expect(result).toHaveProperty("error")
    expect(mockedCompanyUpdate).not.toHaveBeenCalled()
  })

  it("recusa um status que não existe no enum, mesmo vindo de um usuário autorizado", async () => {
    loginComoUsuarioInterno()

    const result = await updateCompanyStatus("c1", "NAO_EXISTE")

    expect(result).toEqual({ error: "Status inválido." })
    expect(mockedCompanyUpdate).not.toHaveBeenCalled()
  })

  it("atualiza o status quando o usuário é autorizado e o status é válido", async () => {
    loginComoUsuarioInterno()
    mockedCompanyUpdate.mockResolvedValue({} as never)

    const result = await updateCompanyStatus("c1", "CONCLUIDO")

    expect(result).toEqual({ success: true })
    expect(mockedCompanyUpdate).toHaveBeenCalledWith({
      where: { id: "c1" },
      data: { status: "CONCLUIDO" },
    })
  })

  it("devolve uma mensagem de erro genérica se o banco falhar, em vez de derrubar a página", async () => {
    loginComoUsuarioInterno()
    vi.spyOn(console, "error").mockImplementation(() => {})
    mockedCompanyUpdate.mockRejectedValue(new Error("connection refused"))

    const result = await updateCompanyStatus("c1", "CONCLUIDO")

    expect(result).toEqual({ error: "Erro ao atualizar status da empresa." })
  })
})
