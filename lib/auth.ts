import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { getSessionRole } from "@/lib/session-role"

/** Erro esperado de autorização — a mensagem é segura para mostrar ao usuário. */
export class ActionError extends Error {}

/**
 * Garante que quem chamou a Server Action é um usuário interno da Tecnasa
 * (não um cliente do portal) autenticado e cadastrado em `User`.
 */
export async function requireInternalUser() {
  const { userId: clerkId, sessionClaims } = await auth()
  if (!clerkId) throw new ActionError("Não autenticado.")
  if (getSessionRole(sessionClaims) === "client") {
    throw new ActionError("Esta ação não está disponível para contas de cliente.")
  }

  const user = await prisma.user.findUnique({ where: { clerkId } })
  if (!user) throw new ActionError("Usuário interno não encontrado.")
  return user
}

/** Igual a `requireInternalUser`, mas só libera para role ADMIN. */
export async function requireAdmin() {
  const user = await requireInternalUser()
  if (user.role !== "ADMIN") {
    throw new ActionError("Apenas administradores podem executar esta ação.")
  }
  return user
}

/** Converte o resultado de uma Server Action em `{ error }`, preservando a mensagem quando for um ActionError conhecido. */
export function toActionError(err: unknown, fallback = "Ocorreu um erro. Tente novamente."): { error: string } {
  if (err instanceof ActionError) return { error: err.message }
  console.error(err)
  return { error: fallback }
}
