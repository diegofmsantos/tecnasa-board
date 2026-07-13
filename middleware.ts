import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { getSessionRole } from "@/lib/session-role"

// Fluxo de OAuth do Google: usa o clerkId como "state" para casar o callback
// com o usuário, não a sessão do Clerk. Passa direto sem os redirects abaixo —
// o handler faz sua própria checagem via `auth()`.
const isGoogleOAuthRoute = createRouteMatcher(["/api/google-calendar/(.*)"])

const isAuthRoute = createRouteMatcher(["/login(.*)", "/sign-in(.*)"])

const isInternalRoute = createRouteMatcher([
  "/",
  "/company(.*)",
  "/my-tasks(.*)",
  "/dashboard(.*)",
  "/crm(.*)",
  "/settings(.*)",
  "/api/company(.*)",
  "/api/import(.*)",
])

const isPortalRoute = createRouteMatcher(["/portal(.*)"])

export default clerkMiddleware(async (auth, req) => {
  if (isGoogleOAuthRoute(req)) return NextResponse.next()

  const { userId, sessionClaims } = await auth()
  const role = getSessionRole(sessionClaims)

  // Não logado e rota protegida → login
  if (!userId && !isAuthRoute(req)) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  // Logado tentando acessar login → redireciona para área correta
  if (userId && isAuthRoute(req)) {
    if (role === "client") {
      return NextResponse.redirect(new URL("/portal", req.url))
    }
    return NextResponse.redirect(new URL("/", req.url))
  }

  // Cliente tentando acessar área interna → portal
  if (userId && isInternalRoute(req) && role === "client") {
    return NextResponse.redirect(new URL("/portal", req.url))
  }

  // Equipe interna tentando acessar portal → painel
  if (userId && isPortalRoute(req) && role !== "client") {
    return NextResponse.redirect(new URL("/", req.url))
  }

  return NextResponse.next()
})

export const config = {
  // Antes excluía toda a pasta /api do middleware — isso deixava rotas como
  // /api/import/planning e /api/company/[id]/report sem qualquer checagem de
  // sessão. Agora só ficam de fora assets estáticos.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
