// Único lugar que sabe onde o Clerk guarda o "role" nesta conta.
// O papel pode vir em publicMetadata.role (padrão do Clerk), no campo
// customizado "metadata.role" (JWT template antigo) ou direto na raiz —
// mantemos os três caminhos para não quebrar sessões já emitidas.
interface SessionClaimsShape {
  publicMetadata?: { role?: string }
  metadata?: { role?: string }
  role?: string
}

export type SessionRole = "ADMIN" | "CONSULTOR" | "client"

export function getSessionRole(sessionClaims: unknown): SessionRole | undefined {
  const claims = sessionClaims as SessionClaimsShape | null | undefined
  const role = claims?.publicMetadata?.role ?? claims?.metadata?.role ?? claims?.role
  return role as SessionRole | undefined
}
