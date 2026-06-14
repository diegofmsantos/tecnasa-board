import { getSettings } from "@/app/actions-settings"
import { AppearanceForm } from "@/components/settings/appearance-form"

export default async function SettingsAppearancePage() {
  const settings = await getSettings()

  return (
    <AppearanceForm
      initialValues={{
        companyName:    settings.companyName    ?? "TECNASA",
        companyTagline: settings.companyTagline ?? "Consultoria em Gestão e Processos",
      }}
    />
  )
}