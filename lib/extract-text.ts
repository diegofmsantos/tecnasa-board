import mammoth from "mammoth"

export async function extractTextFromFile(file: File): Promise<string> {
    const buffer = Buffer.from(await file.arrayBuffer())
    const name = file.name.toLowerCase()

    if (name.endsWith(".txt")) {
        return buffer.toString("utf-8")
    }

    if (name.endsWith(".pdf")) {
        // Importação dinâmica — garante que pdf-parse nunca vai para o bundle do cliente.
        // A v2 do pdf-parse usa uma API baseada em classe (PDFParse), não a função
        // callable da v1 que o pacote @types/pdf-parse (agora obsoleto) descrevia.
        const { PDFParse } = await import("pdf-parse")
        const parser = new PDFParse({ data: buffer })
        try {
            const result = await parser.getText()
            if (!result.text?.trim()) {
                throw new Error("Não foi possível extrair texto do PDF. O arquivo pode ser uma imagem escaneada.")
            }
            return result.text
        } finally {
            await parser.destroy()
        }
    }

    if (name.endsWith(".docx")) {
        const result = await mammoth.extractRawText({ buffer })
        if (!result.value?.trim()) {
            throw new Error("Não foi possível extrair texto do documento Word.")
        }
        return result.value
    }

    throw new Error("Formato não suportado. Use arquivos .txt, .pdf ou .docx")
}