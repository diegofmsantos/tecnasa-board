import mammoth from "mammoth"

export async function extractTextFromFile(file: File): Promise<string> {
    const buffer = Buffer.from(await file.arrayBuffer())
    const name = file.name.toLowerCase()

    if (name.endsWith(".txt")) {
        return buffer.toString("utf-8")
    }

    if (name.endsWith(".pdf")) {
        // Importação dinâmica — garante que pdf-parse nunca vai para o bundle do cliente
        const pdfParseModule = await import("pdf-parse")
        const pdfParse = (pdfParseModule as any).default ?? pdfParseModule
        const data = await pdfParse(buffer)
        if (!data.text?.trim()) {
            throw new Error("Não foi possível extrair texto do PDF. O arquivo pode ser uma imagem escaneada.")
        }
        return data.text
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