import { useEffect, useState } from 'react'
import { ClipboardList, FileText, Receipt, StickyNote } from 'lucide-react'
import { ContractWizard } from '../components/contract/ContractWizard'
import { QuickActionsCard } from '../components/dashboard/QuickActionsCard'
import { RecentContractsTable } from '../components/dashboard/RecentContractsTable'
import { StatCard } from '../components/dashboard/StatCard'
import { fetchDashboard, type DashboardSummary } from '../api/contracts'
import { useAuth } from '../auth/AuthContext'
import { useLanguage } from '../i18n/LanguageProvider'

export function DashboardPage() {
  const { user } = useAuth()
  const { t, formatMoney, interpolate } = useLanguage()
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadDashboard = (alive = true) => {
    fetchDashboard()
      .then((data) => {
        if (alive) setDashboard(data)
      })
      .catch((err) => {
        if (alive) setError(err instanceof Error ? err.message : 'Dashboard failed to load')
      })
  }

  useEffect(() => {
    if (!user?.id) return
    let alive = true
    setDashboard(null)
    setError(null)
    loadDashboard(alive)

    return () => {
      alive = false
    }
  }, [user?.id])

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-100">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<ClipboardList className="h-5 w-5 text-primary" />}
          title={t.dashboard.contractsToday}
          value={String(dashboard?.todayCompletedCount ?? 0)}
          subtext="Completed today"
          subtextTone="up"
        />
        <StatCard
          icon={<Receipt className="h-5 w-5 text-emerald-600" />}
          title={t.dashboard.totalPurchaseToday}
          value={formatMoney(Number(dashboard?.todayPurchaseTotal ?? 0))}
          subtext="From completed contracts"
          subtextTone="up"
        />
        <StatCard
          icon={<FileText className="h-5 w-5 text-indigo-600" />}
          title={t.dashboard.currentContracts}
          value={String(dashboard?.allContractsCount ?? 0)}
          subtext={t.dashboard.viewCurrentContracts}
          subtextTone="neutral"
        />
        <StatCard
          icon={<StickyNote className="h-5 w-5 text-amber-600" />}
          title={t.dashboard.draftContracts}
          value={String(dashboard?.draftContractsCount ?? 0)}
          subtext={t.dashboard.continueEditing}
          subtextTone="neutral"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-8 xl:col-span-9">
          <RecentContractsTable contracts={dashboard?.recentContracts ?? []} onDeleted={() => loadDashboard()} />
        </div>
        <div className="min-w-0 lg:col-span-4 xl:col-span-3">
          <QuickActionsCard />
        </div>
      </div>

      <ContractWizard compact />

      <div className="py-4 text-center text-xs text-slate-400">
        {interpolate(t.app.footer, { year: new Date().getFullYear() })}
      </div>
    </div>
  )
}
