import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"
import type { Prisma, ActivityAction, ActivityEntity } from "@prisma/client"

type PrismaClientOrTx = typeof prisma | Prisma.TransactionClient

interface LogOptions {
  action:      ActivityAction
  entity:      ActivityEntity
  entityId?:   string
  description: string
  companyId?:  string
}

/**
 * Registra uma entrada de auditoria.
 *
 * Quando chamada com um `tx` (dentro de `prisma.$transaction`), erros
 * propagam — assim a mutação principal desfaz junto se o log falhar,
 * evitando o cenário de "operação aplicada mas sem rastro no histórico".
 * Sem `tx`, o log é best-effort e nunca derruba o fluxo chamador.
 */
export async function logActivity(options: LogOptions, tx?: PrismaClientOrTx) {
  const client = tx ?? prisma

  const write = async () => {
    const { userId: clerkId } = await auth()
    const user = clerkId
      ? await client.user.findUnique({ where: { clerkId }, select: { id: true } })
      : null

    await client.activityLog.create({
      data: {
        action:      options.action,
        entity:      options.entity,
        entityId:    options.entityId,
        description: options.description,
        companyId:   options.companyId,
        userId:      user?.id ?? null,
      },
    })
  }

  if (tx) {
    await write()
    return
  }

  try {
    await write()
  } catch {
    // Log nunca deve quebrar a operação principal fora de uma transação
  }
}