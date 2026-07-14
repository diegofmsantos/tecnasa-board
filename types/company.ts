import type { Prisma } from "@prisma/client"

// Espelha o `include` usado em app/company/[id]/page.tsx — mantenha os dois em sincronia.
export type CompanyWithPlanner = Prisma.CompanyGetPayload<{
  include: {
    deliverables: { include: { user: { select: { name: true } } } }
    sectors: {
      include: {
        processes: {
          include: {
            tasks: {
              include: {
                _count: { select: { comments: true } }
                user: { select: { id: true; name: true } }
              }
            }
          }
        }
      }
    }
  }
}>

export type SectorWithPlanner = CompanyWithPlanner["sectors"][number]
export type ProcessWithPlanner = SectorWithPlanner["processes"][number]
export type TaskWithPlanner = ProcessWithPlanner["tasks"][number]
