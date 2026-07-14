import { describe, it, expect } from "vitest"
import { cn } from "./utils"

describe("cn", () => {
  it("junta várias classes em uma única string", () => {
    expect(cn("p-2", "text-sm")).toBe("p-2 text-sm")
  })

  it("deixa a classe mais recente vencer um conflito do Tailwind", () => {
    // p-4 deve "vencer" p-2, e não os dois ficarem juntos
    expect(cn("p-2", "p-4")).toBe("p-4")
  })

  it("ignora valores falsy (usado para classes condicionais)", () => {
    expect(cn("p-2", false, undefined, null, "text-sm")).toBe("p-2 text-sm")
  })
})
