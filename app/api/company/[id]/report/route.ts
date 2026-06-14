import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { renderToStream } from "@react-pdf/renderer"
import { CompanyReportPDF } from "@/components/company-report-pdf"
import React from "react"

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

    const company = await prisma.company.findUnique({
        where: { id },
        include: {
            sectors: {
                include: {
                    processes: {
                        include: {
                            tasks: { orderBy: { createdAt: "asc" } },
                        },
                        orderBy: { createdAt: "asc" },
                    },
                },
                orderBy: { name: "asc" },
            },
        },
    })

    if (!company) {
        return NextResponse.json({ error: "Empresa não encontrada." }, { status: 404 })
    }

    const generatedAt = new Date().toLocaleDateString("pt-BR", {
        day: "2-digit", month: "long", year: "numeric",
    })

    try {
        const element = React.createElement(CompanyReportPDF, {
            company: company as any,
            generatedAt,
        })

        // @ts-ignore
        const stream = await renderToStream(element)

        // Coleta os chunks do stream em um buffer
        const chunks: Buffer[] = []
        await new Promise<void>((resolve, reject) => {
            stream.on("data", (chunk: Buffer) => chunks.push(chunk))
            stream.on("end", resolve)
            stream.on("error", reject)
        })

        const buffer = Buffer.concat(chunks)

        const filename = `relatorio-${company.name
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, "-")}.pdf`

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="${filename}"`,
                "Content-Length": buffer.length.toString(),
            },
        })
    } catch (err) {
        console.error("Erro ao gerar PDF:", err)
        return NextResponse.json({ error: "Erro ao gerar o relatório." }, { status: 500 })
    }
}