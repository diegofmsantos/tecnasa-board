import { describe, it, expect } from "vitest"
import { COMPANY_STATUS_CONFIG, COMPANY_STATUS_OPTIONS } from "./company-status"
import { companyStatusValues } from "./validations"

// Este teste existe por causa de um bug real: o enum CompanyStatus do banco e
// o "dicionário" de cores/labels usado na UI são duas listas mantidas à mão,
// em arquivos diferentes. Se alguém adicionar um novo status no schema do
// Prisma e esquecer de atualizar aqui, a tela mostra um card sem cor/label —
// esse teste falha imediatamente nesse cenário, em vez de descobrirmos
// olhando um card quebrado em produção.
describe("COMPANY_STATUS_CONFIG", () => {
  it("tem uma entrada para cada status aceito pelo schema de validação", () => {
    for (const status of companyStatusValues) {
      expect(COMPANY_STATUS_CONFIG[status], `faltando config para "${status}"`).toBeDefined()
    }
  })

  it("cada entrada tem label, cor e dot preenchidos", () => {
    for (const cfg of Object.values(COMPANY_STATUS_CONFIG)) {
      expect(cfg.label).toBeTruthy()
      expect(cfg.color).toBeTruthy()
      expect(cfg.bg).toBeTruthy()
      expect(cfg.dot).toBeTruthy()
    }
  })

  it("COMPANY_STATUS_OPTIONS lista exatamente os mesmos ids do config", () => {
    const optionIds = COMPANY_STATUS_OPTIONS.map((o) => o.id).sort()
    const configIds = Object.keys(COMPANY_STATUS_CONFIG).sort()
    expect(optionIds).toEqual(configIds)
  })
})
