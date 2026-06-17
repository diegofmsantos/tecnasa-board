import { NextRequest, NextResponse } from "next/server"
import { google } from "googleapis"

export async function GET(req: NextRequest) {
  // O clerkId vem como query param da página de integrações
  const clerkId = req.nextUrl.searchParams.get("uid")

  if (!clerkId) {
    return NextResponse.redirect(
      new URL("/settings/integrations?error=no_user", req.url)
    )
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/calendar.events"],
    prompt: "consent",
    state: clerkId, 
  })

  return NextResponse.redirect(url)
}