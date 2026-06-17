import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

const isPublicRoute = createRouteMatcher([
  "/login(.*)",
  "/sign-in(.*)",
  "/api/google-calendar/(.*)",
])

const isInternalRoute = createRouteMatcher([
  "/",
  "/company(.*)",
  "/my-tasks(.*)",
  "/dashboard(.*)",
  "/crm(.*)",
  "/settings(.*)",
  "/api/google-calendar/callback(.*)",
])

const isPortalRoute = createRouteMatcher(["/portal(.*)"])

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth()

  // Lê o role — tenta publicMetadata direto e também o campo customizado "metadata"
  const claims = sessionClaims as any
  const role = (claims?.publicMetadata?.role ?? claims?.metadata?.role ?? claims?.role) as string | undefined

  // Não logado e rota protegida → login
  if (!userId && !isPublicRoute(req)) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  // Logado tentando acessar login → redireciona para área correta
  if (userId && isPublicRoute(req)) {
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
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}