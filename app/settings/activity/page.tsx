import { getActivityLogs, getActivityStats } from "@/app/actions-activity"
import { ActivityLogView } from "@/components/settings/activity-log-view"

export default async function SettingsActivityPage() {
    const [logs, stats] = await Promise.all([
        getActivityLogs({ take: 100 }),
        getActivityStats(),
    ])

    return <ActivityLogView logs={logs} companies={stats.companies} users={stats.users} />
}