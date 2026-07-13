"use server"

import { prisma } from "@/lib/prisma"
import { google } from "googleapis"
import { requireInternalUser, toActionError } from "@/lib/auth"

function getOAuthClient(accessToken: string, refreshToken?: string | null) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )
  oauth2Client.setCredentials({
    access_token:  accessToken,
    refresh_token: refreshToken ?? undefined,
  })
  return oauth2Client
}

/**
 * Verifica se o usuário tem o Google Calendar conectado
 */
export async function getGoogleIntegration() {
  const user = await requireInternalUser().catch(() => null)
  if (!user) return null

  return prisma.userIntegration.findUnique({
    where: { userId_provider: { userId: user.id, provider: "google" } },
  })
}

/**
 * Remove a integração com o Google Calendar
 */
export async function disconnectGoogle() {
  try {
    const user = await requireInternalUser()
    await prisma.userIntegration.deleteMany({
      where: { userId: user.id, provider: "google" },
    })
    return { success: true }
  } catch (err) {
    return toActionError(err, "Erro ao desconectar o Google Calendar.")
  }
}

/**
 * Sincroniza as tarefas de uma empresa com o Google Calendar do usuário
 */
export async function syncCompanyToGoogleCalendar(companyId: string) {
  try {
    const user = await requireInternalUser()

    const integration = await prisma.userIntegration.findUnique({
      where: { userId_provider: { userId: user.id, provider: "google" } },
    })

    if (!integration) {
      return { error: "Google Calendar não conectado. Conecte em Configurações → Integrações." }
    }

    // Busca a empresa com todas as tarefas que têm datas
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        sectors: {
          include: {
            processes: {
              include: {
                tasks: {
                  where: {
                    OR: [
                      { startDate: { not: null } },
                      { dueDate:   { not: null } },
                    ],
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!company) return { error: "Empresa não encontrada." }

    const auth = getOAuthClient(integration.accessToken, integration.refreshToken)
    const calendar = google.calendar({ version: "v3", auth })

    let synced = 0

    for (const sector of company.sectors) {
      for (const process of sector.processes) {
        for (const task of process.tasks) {
          const start = task.startDate ?? task.dueDate!
          const end   = task.dueDate   ?? task.startDate!

          // Formata datas como "all-day" (só data, sem hora)
          const startDate = new Date(start).toISOString().split("T")[0]
          const endDate   = new Date(end).toISOString().split("T")[0]

          const event = {
            summary:     `[${company.name}] ${task.title}`,
            description: [
              `Empresa: ${company.name}`,
              `Setor: ${sector.name}`,
              `Etapa: ${process.title}`,
              `Status: ${task.status === "DONE" ? "Concluído" : task.status === "IN_PROGRESS" ? "Em Andamento" : "Novo"}`,
              task.notes ? `Observações: ${task.notes}` : "",
            ].filter(Boolean).join("\n"),
            start: { date: startDate },
            end:   { date: endDate   },
            colorId: task.status === "DONE" ? "2" // verde
                   : task.status === "IN_PROGRESS" ? "5" // amarelo
                   : "8", // cinza
          }

          await calendar.events.insert({
            calendarId: "primary",
            requestBody: event,
          })

          synced++
        }
      }
    }

    return { success: true, synced }
  } catch (err: unknown) {
    console.error("Google Calendar sync error:", err)
    if (err && typeof err === "object" && "code" in err && (err as { code: unknown }).code === 401) {
      return { error: "Token expirado. Reconecte o Google Calendar em Configurações." }
    }
    return toActionError(err, "Erro ao sincronizar. Tente novamente.")
  }
}
