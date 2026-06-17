import { NextRequest, NextResponse } from "next/server"
import { google } from "googleapis"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const code    = req.nextUrl.searchParams.get("code")
  const clerkId = req.nextUrl.searchParams.get("state")

  if (!code) {
    return NextResponse.redirect(new URL("/settings/integrations?error=no_code", req.url))
  }

  if (!clerkId) {
    return NextResponse.redirect(new URL("/settings/integrations?error=no_state", req.url))
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