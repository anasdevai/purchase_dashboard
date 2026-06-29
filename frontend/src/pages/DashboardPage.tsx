import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { fetchDashboard, type DashboardSummary } from '../api/contracts'
import { fetchRepairOrders } from '../api/repairOrders'
import { fetchSpareParts } from '../api/inventory'
import { fetchQuotations } from '../api/quotations'
import { fetchAppointments } from '../api/appointments'
import { useAuth } from '../auth/AuthContext'
import { useLanguage } from '../i18n/LanguageProvider'
import { useAppConfirm } from '../components/common/ConfirmDialogProvider'
import { getFriendlyErrorMessage, logApiError } from '../utils/apiErrors'
import type { RepairOrder } from '../types/repairOrder'
import type { SparePart } from '../types/inventory'
import type { Quotation } from '../types/quotation'
import type { Appointment } from '../types/appointment'
import {
  buildPipelineSteps,
  buildPriorityItems,
  ContactCard,
  dashboardLocale,
  LiveRepairsCard,
  LowStockCard,
  MetricCard,
  PriorityCard,
  WelcomeBanner,
  WorkflowCard,
  type ContactPerson,
  Wrench,
  Package,
  Receipt,
  PackageCheck,
} from '../components/dashboard/PurchaseDashboardWidgets'

function todayRangeIso() {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date()
  end.setHours(23, 59, 59, 999)
  return { start: start.toISOString(), end: end.toISOString(), startMs: start.getTime(), endMs: end.getTime() }
}

const PENDING_QUOTE_STATUSES = new Set<Quotation['status']>(['Draft', 'Sent'])

export function DashboardPage() {
  const { user } = useAuth()
  const { t, language, formatDate } = useLanguage()
  const { showToast } = useAppConfirm()
  const location = useLocation()
  // Dedupe guards so the dashboard data is fetched once per (user + navigation),
  // even under React StrictMode's double-invoked effects and HMR re-renders.
  const loadedKeyRef = useRef<string | null>(null)
  const mountedRef = useRef(true)
  const loadCountRef = useRef(0)

  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null)
  const [activeOrders, setActiveOrders] = useState<RepairOrder[]>([])
  const [completedOrders, setCompletedOrders] = useState<RepairOrder[]>([])
  const [spareParts, setSpareParts] = useState<SparePart[]>([])
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  const loc = useMemo(() => dashboardLocale(language), [language])

  useEffect(() => {
    if (!user?.id) return

    // One fetch batch per (user, navigation). A ref keyed on this survives
    // StrictMode's mount→unmount→mount cycle, so the second invocation is
    // skipped instead of firing every dashboard endpoint a second time.
    const loadKey = `${user.id}::${location.key}`
    mountedRef.current = true
    if (loadedKeyRef.current === loadKey) {
      return () => {
        mountedRef.current = false
      }
    }
    loadedKeyRef.current = loadKey

    const callNo = ++loadCountRef.current
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.debug(`[dashboard] data load #${callNo} (key=${loadKey})`)
    }

    setLoaded(false)
    setError(null)

    const range = todayRangeIso()
    Promise.allSettled([
      fetchDashboard(),
      fetchRepairOrders('', 'active'),
      fetchRepairOrders('', 'Completed'),
      fetchSpareParts(),
      fetchQuotations(),
      fetchAppointments(range.start, range.end),
    ])
      .then(([dash, active, completed, parts, quotes, appts]) => {
        if (!mountedRef.current) return
        if (dash.status === 'fulfilled') setDashboard(dash.value)
        if (active.status === 'fulfilled') setActiveOrders(active.value)
        if (completed.status === 'fulfilled') setCompletedOrders(completed.value)
        if (parts.status === 'fulfilled') setSpareParts(parts.value)
        if (quotes.status === 'fulfilled') setQuotations(quotes.value)
        if (appts.status === 'fulfilled') setAppointments(appts.value)

        if (dash.status === 'rejected') {
          logApiError('dashboard load', dash.reason)
          setError(getFriendlyErrorMessage(dash.reason, 'load', t))
        } else {
          setError(null)
        }
      })
      .finally(() => {
        if (mountedRef.current) setLoaded(true)
      })

    return () => {
      mountedRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, location.key])

  /* ----- Derived data ----- */

  const { startMs, endMs } = todayRangeIso()

  const lowStockParts = useMemo(
    () =>
      spareParts
        .filter((part) => part.isActive !== false && part.stock <= part.minimumStock)
        .sort((a, b) => a.stock - a.minimumStock - (b.stock - b.minimumStock)),
    [spareParts],
  )

  const pendingQuotes = useMemo(
    () => quotations.filter((q) => PENDING_QUOTE_STATUSES.has(q.status)),
    [quotations],
  )

  const waitingCount = useMemo(
    () => activeOrders.filter((o) => o.status === 'WaitingForCustomerFeedback').length,
    [activeOrders],
  )

  const urgentCount = useMemo(
    () =>
      activeOrders.filter((o) => {
        if (o.status === 'WorkPending') return true
        if (!o.expectedCompletionDate) return false
        return new Date(o.expectedCompletionDate).getTime() <= endMs
      }).length,
    [activeOrders, endMs],
  )

  const completedToday = useMemo(
    () =>
      completedOrders.filter((o) => {
        const ts = new Date(o.updatedAt).getTime()
        return ts >= startMs && ts <= endMs
      }).length,
    [completedOrders, startMs, endMs],
  )

  const invoicingNeeded = useMemo(
    () => completedOrders.filter((o) => !o.invoices || o.invoices.length === 0).length,
    [completedOrders],
  )

  const contacts = useMemo<ContactPerson[]>(() => {
    const seen = new Set<string>()
    const people: ContactPerson[] = []
    for (const order of activeOrders) {
      const key = order.customerPhone || order.customerEmail || order.customerName
      if (!key || seen.has(key)) continue
      seen.add(key)
      people.push({
        id: order.id,
        name: order.customerName || '—',
        phone: order.customerPhone || '',
        email: order.customerEmail,
      })
      if (people.length >= 5) break
    }
    return people
  }, [activeOrders])

  const priorityItems = buildPriorityItems(loc, {
    urgent: urgentCount,
    ready: Number(dashboard?.readyForPickupCount ?? 0),
    waiting: waitingCount,
    appointments: appointments.length,
  })

  const pipelineSteps = buildPipelineSteps(loc, {
    intake: Number(dashboard?.repairOrdersToday ?? 0),
    quotes: pendingQuotes.length,
    purchases: Number(dashboard?.draftContracts ?? 0),
    support: waitingCount,
    invoicing: invoicingNeeded,
  })

  const statusLabel = (status: RepairOrder['status']) => t.repairOrders.statuses[status]

  const formatEta = (order: RepairOrder) => {
    if (!order.expectedCompletionDate) return '—'
    const iso = order.expectedCompletionDate.slice(0, 10)
    const ts = new Date(order.expectedCompletionDate).getTime()
    if (ts >= startMs && ts <= endMs) return loc.today
    try {
      return formatDate(iso)
    } catch {
      return iso
    }
  }

  const handleCopy = (value: string) => {
    if (!value) return
    navigator.clipboard
      ?.writeText(value)
      .then(() => showToast('success', loc.copied))
      .catch(() => {
        /* clipboard unavailable — ignore */
      })
  }

  const userName = user?.name || t.common.defaultStaffUser

  if (!loaded) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-primary" />
      </div>
    )
  }

  return (
    <div className="py-2">
      {error ? (
        <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-100">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_385px] gap-6 xl:gap-8 items-start">
        {/* Left Column */}
        <div className="space-y-6 xl:space-y-8 min-w-0">
          <WelcomeBanner loc={loc} userName={userName} to="/repair-orders/new" />

          <LiveRepairsCard
            loc={loc}
            orders={activeOrders.slice(0, 3)}
            statusLabel={statusLabel}
            formatEta={formatEta}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-[13px]">
            <MetricCard
              testId="stat-devices-in-repair"
              icon={Wrench}
              title={loc.statDevicesInRepair}
              value={String(activeOrders.length)}
              subTrend="+12%"
              to="/repair-orders"
            />
            <MetricCard
              testId="stat-parts-low"
              icon={Package}
              title={loc.statPartsLow}
              value={String(lowStockParts.length)}
              sub={loc.showAllArrow}
              to="/inventory/parts"
            />
            <MetricCard
              testId="stat-quotes-pending"
              icon={Receipt}
              title={loc.statQuotesPending}
              value={String(pendingQuotes.length)}
              subTrend="+2"
              to="/quotations"
            />
            <MetricCard
              testId="stat-completed"
              icon={PackageCheck}
              title={loc.statCompleted}
              value={String(completedToday)}
              subTrend="+29%"
            />
          </div>

          <WorkflowCard loc={loc} steps={pipelineSteps} />
        </div>

        {/* Right Column */}
        <div className="space-y-6 xl:space-y-8">
          <PriorityCard loc={loc} items={priorityItems} />
          <ContactCard loc={loc} people={contacts} onCopy={handleCopy} />
          <LowStockCard loc={loc} parts={lowStockParts.slice(0, 4)} />
        </div>
      </div>
    </div>
  )
}
