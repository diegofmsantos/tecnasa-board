import { describe, it, expect } from "vitest"
import { getSessionRole } from "./session-role"

// O Clerk pode guardar o role em 3 lugares diferentes dependendo de como a
// conta foi configurada (ver comentário em session-role.ts). Estes testes
// garantem que os 3 caminhos continuam funcionando e que a ordem de
// prioridade entre eles não muda sem querer.
describe("getSessionRole", () => {
  it("lê o role de publicMetadata (padrão do Clerk)", () => {
    expect(getSessionRole({ publicMetadata: { role: "ADMIN" } })).toBe("ADMIN")
  })

  it("cai para metadata.role quando publicMetadata não tem role", () => {
    expect(getSessionRole({ metadata: { role: "client" } })).toBe("client")
  })

  it("cai para um campo role na raiz quando os outros dois não existem", () => {
    expect(getSessionRole({ role: "CONSULTOR" })).toBe("CONSULTOR")
  })

  it("prioriza publicMetadata quando mais de um caminho está presente", () => {
    const claims = {
      publicMetadata: { role: "ADMIN" },
      metadata: { role: "CONSULTOR" },
      role: "client",
    }
    expect(getSessionRole(claims)).toBe("ADMIN")
  })

  it("retorna undefined quando não há sessão (claims nulo ou vazio)", () => {
    expect(getSessionRole(null)).toBeUndefined()
    expect(getSessionRole(undefined)).toBeUndefined()
    expect(getSessionRole({})).toBeUndefined()
  })
})
