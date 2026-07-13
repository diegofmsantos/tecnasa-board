import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Equivalente ao antigo `webpack.resolve.alias.canvas = false`: o
  // pdf-parse/pdfjs tenta resolver o pacote opcional `canvas` (nativo, usado
  // só para renderizar PDF em <canvas> no navegador) mesmo em ambiente
  // server-only. Alias para false evita o build tentar compilar esse binário.
  turbopack: {
    resolveAlias: {
      canvas: "./lib/empty-module.ts",
    },
  },
}

export default nextConfig