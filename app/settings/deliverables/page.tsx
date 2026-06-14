import { getDeliverableTypes } from "@/app/actions-settings"
import { DeliverableTypesManager } from "@/components/settings/deliverable-types-manager"

export default async function SettingsDeliverablesPage() {
    const types = await getDeliverableTypes()
    return <DeliverableTypesManager types={types} />
}