import { getGoogleIntegration } from "@/app/actions-google-calendar"
import { IntegrationsManager } from "@/components/settings/integrations-manager"

export default async function SettingsIntegrationsPage() {
  const googleIntegration = await getGoogleIntegration()

  return (
    <IntegrationsManager
      googleConnected={!!googleIntegration}
      googleConnectedAt={googleIntegration?.createdAt ?? null}
    />
  )
}