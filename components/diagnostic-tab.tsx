import { DiagnosticAI } from "@/components/diagnostic-ai"

interface Props {
    companyId: string
    companyName: string
    sectors: { id: string; name: string }[]
}

interface Transcript {
    id: string
    title: string
    content: string
    createdAt: Date
    sector?: { id: string; name: string } | null
    user?: { name: string } | null
}

interface Session {
    id: string
    title: string
    createdAt: Date
    updatedAt: Date
    transcripts: { id: string; title: string }[]
    user?: { name: string } | null
}

interface Props {
    companyId: string
    companyName: string
    sectors: { id: string; name: string }[]
    initialTranscripts: Transcript[]
    initialSessions: Session[]
    apiEnabled: boolean
}


export function DiagnosticTab(props: Props) {
  return <DiagnosticAI {...props} />
}
