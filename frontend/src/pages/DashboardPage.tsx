import { useEffect, useState } from 'react'
import {
  Banknote,
  CircleDollarSign,
  ClipboardList,
  FileText,
  PackageCheck,
  Receipt,
  StickyNote,
  Wrench,
} from 'lucide-react'
import { ContractWizard } from '../components/contract/ContractWizard'
import { QuickActionsCard } from '../components/dashboard/QuickActionsCard'
import { RecentContractsTable } from '../components/dashboard/RecentContractsTable'
import { StatCard } from '../components/dashboard/StatCard'
import { fetchDashboard, type DashboardSummary } from '../api/contracts'
import { useAuth } from '../auth/AuthContext'
import { useLanguage } from '../i18n/LanguageProvider'
import { getFriendlyErrorMessage, logApiError } from '../utils/apiErrors'

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
        logApiError('dashboard load', err)
        if (alive) setError(getFriendlyErrorMessage(err, 'load', t))
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

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700">{t.dashboard.purchaseContractsSection}</h2>
        <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            testId="stat-card-contracts-today"
            icon={<ClipboardList className="h-5 w-5 text-primary" />}
            title={t.dashboard.contractsToday}
            value={String(dashboard?.contractsToday ?? 0)}
            subtext={t.dashboard.contractsTodaySub}
            subtextTone="neutral"
          />
          <StatCard
            testId="stat-card-purchase-today"
            icon={<Receipt className="h-5 w-5 text-amber-600" />}
            title={t.dashboard.totalPurchaseToday}
            value={formatMoney(Number(dashboard?.todayPurchaseTotal ?? 0))}
            subtext={t.dashboard.totalPurchaseTodaySub}
            subtextTone="neutral"
          />
          <StatCard
            testId="stat-card-current-contracts"
            icon={<FileText className="h-5 w-5 text-indigo-600" />}
            title={t.dashboard.currentContracts}
            value={String(dashboard?.currentContracts ?? 0)}
            subtext={t.dashboard.viewCurrentContracts}
            subtextTone="neutral"
          />
          <StatCard
            testId="stat-card-drafts"
            icon={<StickyNote className="h-5 w-5 text-slate-600" />}
            title={t.dashboard.draftContracts}
            value={String(dashboard?.draftContracts ?? 0)}
            subtext={t.dashboard.continueEditing}
            subtextTone="neutral"
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700">{t.dashboard.repairsInvoicesSection}</h2>
        <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <StatCard
            layout="stacked"
            testId="stat-card-repair-orders-today"
            icon={<Wrench className="h-5 w-5 text-primary" />}
            title={t.dashboard.repairOrdersToday}
            value={String(dashboard?.repairOrdersToday ?? 0)}
            subtext={t.dashboard.repairOrdersTodaySub}
            subtextTone="neutral"
          />
          <StatCard
            layout="stacked"
            testId="stat-card-ready-for-pickup"
            icon={<PackageCheck className="h-5 w-5 text-sky-600" />}
            title={t.dashboard.readyForPickup}
            value={String(dashboard?.readyForPickupCount ?? 0)}
            subtext={t.dashboard.readyForPickupSub}
            subtextTone="neutral"
          />
          <StatCard
            layout="stacked"
            testId="stat-card-paid-invoice-revenue-today"
            icon={<Banknote className="h-5 w-5 text-emerald-600" />}
            title={t.dashboard.paidInvoiceRevenueToday}
            value={formatMoney(Number(dashboard?.paidInvoiceRevenueToday ?? 0))}
            subtext={t.dashboard.paidInvoiceRevenueTodaySub}
            subtextTone="up"
          />
          <StatCard
            layout="stacked"
            testId="stat-card-open-invoice-amount"
            icon={<Receipt className="h-5 w-5 text-orange-600" />}
            title={t.dashboard.openInvoiceAmount}
            value={formatMoney(Number(dashboard?.openInvoiceAmount ?? 0))}
            subtext={t.dashboard.openInvoiceAmountSub}
            subtextTone="neutral"
          />
          <StatCard
            layout="stacked"
            testId="stat-card-repair-revenue-today"
            icon={<CircleDollarSign className="h-5 w-5 text-emerald-600" />}
            title={t.dashboard.repairRevenueToday}
            value={formatMoney(Number(dashboard?.repairRevenueToday ?? 0))}
            subtext={t.dashboard.repairRevenueTodaySub}
            subtextTone="up"
          />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-8 xl:col-span-9">
          <RecentContractsTable contracts={dashboard?.recentContracts ?? []} onDeleted={() => loadDashboard()} />
        </div>
        <div className="min-w-0 lg:col-span-4 xl:col-span-3">
          <QuickActionsCard />
        </div>
      </div>

      <ContractWizard
        compact
        onCompleted={() => {
          loadDashboard()
        }}
      />

      <div className="py-4 text-center text-xs text-slate-400">
        {interpolate(t.app.footer, { year: new Date().getFullYear() })}
      </div>
    </div>
  )
}
