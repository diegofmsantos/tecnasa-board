import {
    Document, Page, Text, View, StyleSheet, Image
} from "@react-pdf/renderer"

// ─── Estilos ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    page: {
        fontFamily: "Helvetica",
        backgroundColor: "#f8f8f8",
        padding: 0,
    },

    // Header azul escuro
    header: {
        backgroundColor: "#332f5c",
        paddingHorizontal: 40,
        paddingVertical: 28,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    headerLeft: { flexDirection: "row", alignItems: "center", gap: 14 },
    logoBox: {
        width: 48, height: 48,
        backgroundColor: "#fff",
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
    },
    logoImg: { width: 44, height: 44, objectFit: "contain" },
    logoPlaceholder: {
        width: 44, height: 44,
        backgroundColor: "#484776",
        borderRadius: 6,
    },
    companyName: { color: "#fff", fontSize: 20, fontFamily: "Helvetica-Bold" },
    companySegment: { color: "#cbff2d", fontSize: 10, marginTop: 2 },
    headerRight: { alignItems: "flex-end" },
    reportTitle: { color: "#cbff2d", fontSize: 11, fontFamily: "Helvetica-Bold", letterSpacing: 1.5 },
    reportDate: { color: "rgba(255,255,255,0.6)", fontSize: 9, marginTop: 3 },

    // Corpo
    body: { paddingHorizontal: 36, paddingVertical: 24, paddingBottom: 60, },

    // Status badge
    statusRow: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
    statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
    statusText: { fontSize: 10, fontFamily: "Helvetica-Bold" },

    // Grid de métricas
    metricsGrid: { flexDirection: "row", gap: 10, marginBottom: 20 },
    metricCard: {
        flex: 1,
        backgroundColor: "#fff",
        borderRadius: 8,
        padding: 14,
        borderWidth: 1,
        borderColor: "#e5e7eb",
    },
    metricValue: { fontSize: 24, fontFamily: "Helvetica-Bold", color: "#332f5c" },
    metricLabel: { fontSize: 9, color: "#6b6b8a", marginTop: 3 },

    // Barra de progresso global
    progressSection: {
        backgroundColor: "#fff",
        borderRadius: 8,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: "#e5e7eb",
    },
    sectionTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#332f5c", marginBottom: 12 },
    progressRow: { marginBottom: 10 },
    progressLabel: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
    progressLabelText: { fontSize: 9, color: "#1a1a2e" },
    progressLabelValue: { fontSize: 9, fontFamily: "Helvetica-Bold" },
    progressTrack: { height: 6, backgroundColor: "#f3f4f6", borderRadius: 3 },
    progressFill: { height: 6, borderRadius: 3 },

    // Setores e processos
    sectorSection: {
        backgroundColor: "#fff",
        borderRadius: 8,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        overflow: "hidden",
    },
    sectorHeader: {
        backgroundColor: "#332f5c",
        paddingHorizontal: 14,
        paddingVertical: 10,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    sectorName: { color: "#fff", fontSize: 10, fontFamily: "Helvetica-Bold" },
    sectorCount: { color: "#cbff2d", fontSize: 9, fontFamily: "Helvetica-Bold" },

    processRow: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#f3f4f6",
    },
    processTitle: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#1a1a2e", marginBottom: 6 },
    processTrack: { height: 5, backgroundColor: "#f3f4f6", borderRadius: 3, marginBottom: 4 },
    processFill: { height: 5, borderRadius: 3, backgroundColor: "#484776" },
    processStats: { flexDirection: "row", gap: 12 },
    processStat: { fontSize: 8, color: "#6b6b8a" },

    taskRow: {
        paddingHorizontal: 22,
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: "#f9fafb",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    taskTitle: { fontSize: 8, color: "#374151", flex: 1 },
    taskStatus: { fontSize: 7, fontFamily: "Helvetica-Bold", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },

    // Footer
    footer: {
        borderTopWidth: 1,
        borderTopColor: "#e5e7eb",
        paddingTop: 8,
        paddingHorizontal: 36,
        paddingBottom: 16,
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: "auto",
    },
    footerText: { fontSize: 8, color: "#9ca3af" },
})

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
    TODO: "Novo",
    IN_PROGRESS: "Em Andamento",
    DONE: "Concluído",
}

const STATUS_COLOR: Record<string, string> = {
    TODO: "#9ca3af",
    IN_PROGRESS: "#f59e0b",
    DONE: "#10b981",
}

const STATUS_BG: Record<string, string> = {
    TODO: "#f3f4f6",
    IN_PROGRESS: "#fef3c7",
    DONE: "#d1fae5",
}

const COMPANY_STATUS: Record<string, { label: string; color: string; dot: string }> = {
    EM_DIAGNOSTICO: { label: "Em Diagnóstico", color: "#1d4ed8", dot: "#3b82f6" },
    EM_MAPEAMENTO: { label: "Em Mapeamento", color: "#7e22ce", dot: "#9333ea" },
    EM_IMPLEMENTACAO: { label: "Em Implementação", color: "#b45309", dot: "#f59e0b" },
    EM_MANUTENCAO: { label: "Em Manutenção", color: "#c2410c", dot: "#f97316" },
    CONCLUIDO: { label: "Concluído", color: "#15803d", dot: "#22c55e" },
    PAUSADO: { label: "Pausado", color: "#4b5563", dot: "#9ca3af" },
}

function formatDate(date: Date | string) {
    return new Date(date).toLocaleDateString("pt-BR", {
        day: "2-digit", month: "long", year: "numeric",
    })
}

// ─── Componente principal ────────────────────────────────────────────────────

interface ReportProps {
    company: {
        id: string
        name: string
        logoUrl?: string | null
        segment?: string | null
        contactName?: string | null
        cnpj?: string | null
        status?: string
        sectors: Array<{
            id: string
            name: string
            processes: Array<{
                id: string
                title: string
                tasks: Array<{
                    id: string
                    title: string
                    status: string
                    dueDate?: Date | null
                }>
            }>
        }>
    }
    generatedAt: string
}

export function CompanyReportPDF({ company, generatedAt }: ReportProps) {
    const allTasks = company.sectors.flatMap(s => s.processes.flatMap(p => p.tasks))
    const totalTasks = allTasks.length
    const doneTasks = allTasks.filter(t => t.status === "DONE").length
    const inProgTasks = allTasks.filter(t => t.status === "IN_PROGRESS").length
    const todoTasks = allTasks.filter(t => t.status === "TODO").length
    const donePercent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0
    const inProgPercent = totalTasks > 0 ? Math.round((inProgTasks / totalTasks) * 100) : 0
    const todoPercent = totalTasks > 0 ? Math.round((todoTasks / totalTasks) * 100) : 0

    const statusCfg = COMPANY_STATUS[(company.status ?? "EM_DIAGNOSTICO")] ?? COMPANY_STATUS.EM_DIAGNOSTICO

    return (
        <Document>
            <Page size="A4" style={styles.page}>

                {/* ── Header ── */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <View style={styles.logoBox}>
                            {company.logoUrl
                                ? <Image src={company.logoUrl} style={styles.logoImg} />
                                : <View style={styles.logoPlaceholder} />
                            }
                        </View>
                        <View>
                            <Text style={styles.companyName}>{company.name}</Text>
                            {company.segment && (
                                <Text style={styles.companySegment}>{company.segment}</Text>
                            )}
                        </View>
                    </View>
                    <View style={styles.headerRight}>
                        <Text style={styles.reportTitle}>RELATÓRIO EXECUTIVO</Text>
                        <Text style={styles.reportDate}>Gerado em {generatedAt}</Text>
                    </View>
                </View>

                <View style={styles.body}>

                    {/* ── Status do projeto ── */}
                    <View style={styles.statusRow}>
                        <View style={[styles.statusDot, { backgroundColor: statusCfg.dot }]} />
                        <Text style={[styles.statusText, { color: statusCfg.color }]}>
                            {statusCfg.label}
                        </Text>
                        {company.cnpj && (
                            <Text style={{ fontSize: 9, color: "#9ca3af", marginLeft: 16 }}>
                                CNPJ: {company.cnpj}
                            </Text>
                        )}
                        {company.contactName && (
                            <Text style={{ fontSize: 9, color: "#9ca3af", marginLeft: 16 }}>
                                Contato: {company.contactName}
                            </Text>
                        )}
                    </View>

                    {/* ── Cards de métricas ── */}
                    <View style={styles.metricsGrid}>
                        {[
                            { label: "Total de Demandas", value: totalTasks, color: "#1d4ed8" },
                            { label: "A Fazer", value: todoTasks, color: "#6b7280" },
                            { label: "Em Andamento", value: inProgTasks, color: "#d97706" },
                            { label: "Concluídas", value: doneTasks, color: "#16a34a" },
                        ].map((m) => (
                            <View key={m.label} style={styles.metricCard}>
                                <Text style={[styles.metricValue, { color: m.color }]}>{m.value}</Text>
                                <Text style={styles.metricLabel}>{m.label}</Text>
                            </View>
                        ))}
                    </View>

                    {/* ── Progresso geral ── */}
                    <View style={styles.progressSection}>
                        <Text style={styles.sectionTitle}>Distribuição das Demandas</Text>

                        {[
                            { label: "A Fazer", value: todoTasks, pct: todoPercent, color: "#9ca3af" },
                            { label: "Em Andamento", value: inProgTasks, pct: inProgPercent, color: "#f59e0b" },
                            { label: "Concluído", value: doneTasks, pct: donePercent, color: "#10b981" },
                        ].map((row) => (
                            <View key={row.label} style={styles.progressRow}>
                                <View style={styles.progressLabel}>
                                    <Text style={styles.progressLabelText}>{row.label}</Text>
                                    <Text style={[styles.progressLabelValue, { color: row.color }]}>
                                        {row.value} ({row.pct}%)
                                    </Text>
                                </View>
                                <View style={styles.progressTrack}>
                                    <View style={[styles.progressFill, { width: `${row.pct}%`, backgroundColor: row.color }]} />
                                </View>
                            </View>
                        ))}

                        {/* Eficiência global */}
                        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#f3f4f6" }}>
                            <Text style={{ fontSize: 10, color: "#6b6b8a", flex: 1 }}>Eficiência Global</Text>
                            <Text style={{ fontSize: 20, fontFamily: "Helvetica-Bold", color: donePercent >= 70 ? "#10b981" : "#f59e0b" }}>
                                {donePercent}%
                            </Text>
                        </View>
                    </View>

                    {/* ── Setores e processos ── */}
                    <Text style={[styles.sectionTitle, { marginBottom: 8 }]}>Detalhamento por Setor</Text>

                    {company.sectors.map((sector) => {
                        const sectorTasks = sector.processes.flatMap(p => p.tasks)
                        const sectorDone = sectorTasks.filter(t => t.status === "DONE").length

                        return (
                            <View key={sector.id} style={styles.sectorSection}>
                                <View style={styles.sectorHeader}>
                                    <Text style={styles.sectorName}>{sector.name}</Text>
                                    <Text style={styles.sectorCount}>
                                        {sectorDone}/{sectorTasks.length} concluídas
                                    </Text>
                                </View>

                                {sector.processes.map((process) => {
                                    const procDone = process.tasks.filter(t => t.status === "DONE").length
                                    const procTotal = process.tasks.length
                                    const procPct = procTotal > 0 ? Math.round((procDone / procTotal) * 100) : 0

                                    return (
                                        <View key={process.id} wrap={false}>
                                            <View style={styles.processRow}>
                                                <Text style={styles.processTitle}>{process.title}</Text>
                                                <View style={styles.processTrack}>
                                                    <View style={[styles.processFill, { width: `${procPct}%` }]} />
                                                </View>
                                                <View style={styles.processStats}>
                                                    <Text style={styles.processStat}>{procDone} de {procTotal} concluídas</Text>
                                                    <Text style={[styles.processStat, { fontFamily: "Helvetica-Bold", color: "#484776" }]}>
                                                        {procPct}%
                                                    </Text>
                                                </View>
                                            </View>

                                            {process.tasks.map((task) => (
                                                <View key={task.id} style={styles.taskRow}>
                                                    <Text style={styles.taskTitle}>{task.title}</Text>
                                                    <Text style={[
                                                        styles.taskStatus,
                                                        { color: STATUS_COLOR[task.status], backgroundColor: STATUS_BG[task.status] }
                                                    ]}>
                                                        {STATUS_LABEL[task.status] ?? task.status}
                                                    </Text>
                                                </View>
                                            ))}
                                        </View>
                                    )
                                })}
                            </View>
                        )
                    })}
                </View>

                {/* ── Footer ── */}
                <View style={styles.footer} fixed>
                    <Text style={styles.footerText}>TECNASA Consultoria · Relatório Executivo</Text>
                    <Text style={styles.footerText}>{company.name} · {generatedAt}</Text>
                </View>

            </Page>
        </Document>
    )
}