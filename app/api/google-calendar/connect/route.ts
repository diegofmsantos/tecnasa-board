import { NextRequest, NextResponse } from "next/server"
import { google } from "googleapis"
import { auth } from "@clerk/nextjs/server"

export async function GET(req: NextRequest) {
  // O clerkId vem da sessão autenticada — nunca de um parâmetro vindo do
  // cliente, senão qualquer usuário logado poderia linkar sua própria conta
  // Google à integração de outro usuário só editando a URL.
  const { userId: clerkId } = await auth()

  if (!clerkId) {
    return NextResponse.redirect(new URL("/login", req.url))
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
