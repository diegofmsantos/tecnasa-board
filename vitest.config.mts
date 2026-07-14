import { defineConfig } from "vitest/config"
import path from "path"

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
  },
  resolve: {
    alias: {
      // Espelha o path alias "@/*" do tsconfig.json
      "@": path.resolve(__dirname, "."),
    },
  },
})
