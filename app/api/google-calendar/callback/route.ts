import { NextRequest, NextResponse } from "next/server"
import { google } from "googleapis"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const code  = req.nextUrl.searchParams.get("code")
  const state = req.nextUrl.searchParams.get("state")

  if (!code) {
    return NextResponse.redirect(new URL("/settings/integrations?error=no_code", req.url))
  }

  if (!state) {
    return NextResponse.redirect(new URL("/settings/integrations?error=no_state", req.url))
  }

  // O `state` foi definido em /connect a partir da sessão autenticada de quem
  // iniciou o fluxo. Exigir que a sessão atual (mesmo navegador, voltando do
  // Google) bata com esse valor impede que alguém troque um `code` seu por
  // tokens gravados na conta de outro usuário.
  const { userId: clerkId } = await auth()
  if (!clerkId || clerkId !== state) {
    return NextResponse.redirect(new URL("/settings/integrations?error=session_mismatch", req.url))
  }

  const user = await prisma.user.findUnique({ where: { clerkId } })
  if (!user) {
    return NextResponse.redirect(new URL("/settings/integrations?error=no_user", req.url))
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    )

    const { tokens } = await oauth2Client.getToken(code)

    await prisma.userIntegration.upsert({
      where:  { userId_provider: { userId: user.id, provider: "google" } },
      update: {
        accessToken:  tokens.access_token!,
        refreshToken: tokens.refresh_token ?? undefined,
        expiresAt:    tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      },
      create: {
        userId:       user.id,
        provider:     "google",
        accessToken:  tokens.access_token!,
        refreshToken: tokens.refresh_token ?? null,
        expiresAt:    tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      },
    })

    return NextResponse.redirect(
      new URL("/settings/integrations?success=google", req.url)
    )
  } catch (err) {
    console.error("Google OAuth error:", err)
    return NextResponse.redirect(
      new URL("/settings/integrations?error=oauth_failed", req.url)
    )
  }
}
