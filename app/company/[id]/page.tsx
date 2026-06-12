import { prisma } from "@/lib/prisma"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Building2 } from "lucide-react"
import { notFound } from "next/navigation"
import { CreateSectorModal } from "@/components/create-sector-modal"
import { CompanyTabs } from "@/components/company-tabs"

type Props = {
  params: Promise<{ id: string }>
}

export default async function CompanyPage({ params }: Props) {
  const { id } = await params

  const users = await prisma.user.findMany({ select: { id: true, name: true } })

  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      deliverables: {
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true } } },
      },
      sectors: {
        include: {
          processes: {
            include: {
              tasks: {
                orderBy: { createdAt: "asc" },
                include: {
                  _count: { select: { comments: true } },
                },
              },
            },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { name: "asc" },
      },
    },
  })

  if (!company) notFound()

  const companyFilter = { process: { sector: { companyId: id } } }
  const [totalTasks, doneCount, inProgressCount, todoCount] = await Promise.all([
    prisma.task.count({ where: companyFilter }),
    prisma.task.count({ where: { ...companyFilter, status: "DONE" } }),
    prisma.task.count({ where: { ...companyFilter, status: "IN_PROGRESS" } }),
    prisma.task.count({ where: { ...companyFilter, status: "TODO" } }),
  ])

  return (
    <div className="min-h-screen bg-neutral-bg text-text-main flex flex-col">
      <Sidebar />
      <Header />

      <main className="pl-72 pt-24 pr-8 pb-8 flex-1">
        <Link href="/">
          <Button variant="ghost" className="mb-4 text-text-soft hover:text-dark-primary -ml-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Clientes
          </Button>
        </Link>

        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-4">
            {/* Logo da empresa */}
            <div className="w-14 h-14 rounded-xl overflow-hidden border border-gray-200 flex items-center justify-center bg-white shadow-sm flex-shrink-0">
              {(company as any).logoUrl ? (
                <img
                  src={(company as any).logoUrl}
                  alt={`Logo ${company.name}`}
                  className="w-full h-full object-contain p-1"
                />
              ) : (
                <Building2 className="h-7 w-7 text-tecnasa-primary" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 text-tecnasa-primary mb-1">
                <Building2 className="h-4 w-4" />
                <span className="text-sm font-semibold uppercase tracking-wider">
                  Pasta do Cliente
                </span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-dark-primary">
                {company.name}
              </h1>
              {(company as any).segment && (
                <p className="text-text-soft text-sm mt-1">{(company as any).segment}</p>
              )}
            </div>
          </div>

          <CreateSectorModal companyId={company.id} />
        </div>

        <CompanyTabs
          company={company}
          users={users}
          metrics={{ totalTasks, doneCount, inProgressCount, todoCount }}
        />
      </main>
    </div>
  )
}