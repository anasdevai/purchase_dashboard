import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  FileText,
  Receipt,
  Wrench,
  TrendingUp,
  DollarSign,
  UserCheck,
  UserX,
  Shield,
  UserCog,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
} from 'lucide-react'
import { fetchAdminDashboard, type AdminDashboard } from '../../api/admin'
import { useLanguage } from '../../i18n/LanguageProvider'

function StatCard(props: {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  iconBg: string
}) {
  return (
    <div className="card group relative overflow-hidden p-5 transition hover:shadow-md">
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{props.title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-800">{props.value}</p>
          {props.subtitle && (
            <p className="mt-1 text-xs font-semibold text-slate-500">{props.subtitle}</p>
          )}
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${props.iconBg}`}>
          {props.icon}
        </div>
      </div>
    </div>
  )
}

function MiniStat(props: {
  label: string
  value: number
  icon: React.ReactNode
  color: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-150 bg-slate-50/50 px-4 py-3 transition hover:bg-slate-50 hover:border-slate-200">
      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${props.color}`}>
        {props.icon}
      </div>
      <div>
        <p className="text-lg font-bold text-slate-800">{props.value}</p>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{props.label}</p>
      </div>
    </div>
  )
}

export function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const { language, formatMoney, formatDate } = useLanguage()
  const isDe = language === 'de'

  useEffect(() => {
    fetchAdminDashboard()
      .then(setData)
      .catch((err) => setError(err.message || (isDe ? 'Dashboard konnte nicht geladen werden' : 'Failed to load dashboard')))
      .finally(() => setLoading(false))
  }, [isDe])

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          <p className="text-sm font-medium text-slate-500">
            {isDe ? 'Dashboard wird geladen...' : 'Loading dashboard...'}
          </p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-8 py-6 text-center">
          <XCircle className="mx-auto h-8 w-8 text-red-500" />
          <p className="mt-3 text-sm font-medium text-red-700">{error || (isDe ? 'Fehler beim Laden' : 'Failed to load')}</p>
        </div>
      </div>
    )
  }

  const t = {
    title: isDe ? 'Admin-Dashboard' : 'Admin Dashboard',
    subtitle: isDe
      ? 'Vollständiger Überblick über Ihr System — Benutzer, Verträge, Rechnungen und Reparaturaufträge.'
      : 'Complete overview of your system — users, contracts, invoices, and repair orders.',
    totalUsers: isDe ? 'Benutzer Gesamt' : 'Total Users',
    activeSub: (active: number, inactive: number) => isDe ? `${active} aktiv · ${inactive} inaktiv` : `${active} active · ${inactive} inactive`,
    totalContracts: isDe ? 'Verträge Gesamt' : 'Total Contracts',
    contractsSub: (today: number, draft: number) => isDe ? `${today} heute · ${draft} Entwürfe` : `${today} today · ${draft} drafts`,
    totalInvoices: isDe ? 'Rechnungen Gesamt' : 'Total Invoices',
    invoicesSub: (today: number, open: number) => isDe ? `${today} heute · ${open} offen` : `${today} today · ${open} open`,
    repairOrders: isDe ? 'Reparaturaufträge' : 'Repair Orders',
    repairOrdersSub: (today: number, inProgress: number) => isDe ? `${today} heute · ${inProgress} in Bearbeitung` : `${today} today · ${inProgress} in progress`,
    totalRevenue: isDe ? 'Gesamtumsatz' : 'Total Revenue',
    revenueSub: isDe ? 'Aus allen bezahlten Rechnungen' : 'From all paid invoices',
    todaysRevenue: isDe ? 'Umsatz heute' : "Today's Revenue",
    todaysRevenueSub: isDe ? 'Bezahlte Rechnungen heute' : 'Paid invoices today',
    totalPurchases: isDe ? 'Einkäufe Gesamt' : 'Total Purchases',
    purchasesSub: isDe ? 'Alle abgeschlossenen Verträge' : 'All completed contracts',
    todaysPurchases: isDe ? 'Einkäufe heute' : "Today's Purchases",
    todaysPurchasesSub: isDe ? 'Heute abgeschlossene Verträge' : 'Contracts completed today',
    usersBreakdown: isDe ? 'Benutzer-Aufteilung' : 'Users Breakdown',
    admins: isDe ? 'Admins' : 'Admins',
    staff: isDe ? 'Mitarbeiter' : 'Staff',
    active: isDe ? 'Aktiv' : 'Active',
    inactive: isDe ? 'Inaktiv' : 'Inactive',
    contractsBreakdown: isDe ? 'Vertrags-Aufteilung' : 'Contracts Breakdown',
    completed: isDe ? 'Abgeschlossen' : 'Completed',
    draft: isDe ? 'Entwurf' : 'Draft',
    cancelled: isDe ? 'Storniert' : 'Cancelled',
    today: isDe ? 'Heute' : 'Today',
    invoicesBreakdown: isDe ? 'Rechnungs-Aufteilung' : 'Invoices Breakdown',
    paid: isDe ? 'Bezahlt' : 'Paid',
    open: isDe ? 'Offen' : 'Open',
    repairsBreakdown: isDe ? 'Reparatur-Aufteilung' : 'Repair Orders Breakdown',
    received: isDe ? 'Erhalten' : 'Received',
    inProgress: isDe ? 'In Bearbeitung' : 'In Progress',
    ready: isDe ? 'Bereit' : 'Ready',
    recentUsers: isDe ? 'Neueste Benutzer' : 'Recent Users',
    viewAll: isDe ? 'Alle anzeigen' : 'View All',
    thUser: isDe ? 'Benutzer' : 'User',
    thRole: isDe ? 'Rolle' : 'Role',
    thStatus: isDe ? 'Status' : 'Status',
    thContracts: isDe ? 'Verträge' : 'Contracts',
    thInvoices: isDe ? 'Rechnungen' : 'Invoices',
    thRepairs: isDe ? 'Reparaturen' : 'Repairs',
    thJoined: isDe ? 'Registriert' : 'Joined',
  }

  return (
    <div className="min-h-screen px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">{t.title}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {t.subtitle}
        </p>
      </div>

      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title={t.totalUsers}
          value={data.users.total}
          subtitle={t.activeSub(data.users.active, data.users.inactive)}
          icon={<Users className="h-5 w-5 text-violet-600" />}
          iconBg="bg-violet-50 ring-1 ring-violet-100/50"
        />
        <StatCard
          title={t.totalContracts}
          value={data.contracts.total}
          subtitle={t.contractsSub(data.contracts.today, data.contracts.draft)}
          icon={<FileText className="h-5 w-5 text-sky-600" />}
          iconBg="bg-sky-50 ring-1 ring-sky-100/50"
        />
        <StatCard
          title={t.totalInvoices}
          value={data.invoices.total}
          subtitle={t.invoicesSub(data.invoices.today, data.invoices.open)}
          icon={<Receipt className="h-5 w-5 text-emerald-600" />}
          iconBg="bg-emerald-50 ring-1 ring-emerald-100/50"
        />
        <StatCard
          title={t.repairOrders}
          value={data.repairOrders.total}
          subtitle={t.repairOrdersSub(data.repairOrders.today, data.repairOrders.inProgress)}
          icon={<Wrench className="h-5 w-5 text-amber-600" />}
          iconBg="bg-amber-50 ring-1 ring-amber-100/50"
        />
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title={t.totalRevenue}
          value={formatMoney(data.invoices.totalRevenue)}
          subtitle={t.revenueSub}
          icon={<DollarSign className="h-5 w-5 text-emerald-600" />}
          iconBg="bg-emerald-50 ring-1 ring-emerald-100/50"
        />
        <StatCard
          title={t.todaysRevenue}
          value={formatMoney(data.invoices.todayRevenue)}
          subtitle={t.todaysRevenueSub}
          icon={<TrendingUp className="h-5 w-5 text-sky-600" />}
          iconBg="bg-sky-50 ring-1 ring-sky-100/50"
        />
        <StatCard
          title={t.totalPurchases}
          value={formatMoney(data.contracts.totalPurchaseAmount)}
          subtitle={t.purchasesSub}
          icon={<FileText className="h-5 w-5 text-violet-600" />}
          iconBg="bg-violet-50 ring-1 ring-violet-100/50"
        />
        <StatCard
          title={t.todaysPurchases}
          value={formatMoney(data.contracts.todayPurchaseAmount)}
          subtitle={t.todaysPurchasesSub}
          icon={<Clock className="h-5 w-5 text-amber-600" />}
          iconBg="bg-amber-50 ring-1 ring-amber-100/50"
        />
      </div>

      {/* Detailed Breakdowns */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Users Breakdown */}
        <div className="card p-6">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 pb-3 border-b border-slate-100">
            <Users className="h-4 w-4 text-violet-600" />
            {t.usersBreakdown}
          </h3>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MiniStat label={t.admins} value={data.users.admins} icon={<Shield className="h-4 w-4 text-violet-600" />} color="bg-violet-50 ring-1 ring-violet-100/50" />
            <MiniStat label={t.staff} value={data.users.staff} icon={<UserCog className="h-4 w-4 text-sky-600" />} color="bg-sky-50 ring-1 ring-sky-100/50" />
            <MiniStat label={t.active} value={data.users.active} icon={<UserCheck className="h-4 w-4 text-emerald-600" />} color="bg-emerald-50 ring-1 ring-emerald-100/50" />
            <MiniStat label={t.inactive} value={data.users.inactive} icon={<UserX className="h-4 w-4 text-red-600" />} color="bg-red-50 ring-1 ring-red-100/50" />
          </div>
        </div>

        {/* Contracts Breakdown */}
        <div className="card p-6">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 pb-3 border-b border-slate-100">
            <FileText className="h-4 w-4 text-sky-600" />
            {t.contractsBreakdown}
          </h3>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MiniStat label={t.completed} value={data.contracts.completed} icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />} color="bg-emerald-50 ring-1 ring-emerald-100/50" />
            <MiniStat label={t.draft} value={data.contracts.draft} icon={<Clock className="h-4 w-4 text-amber-600" />} color="bg-amber-50 ring-1 ring-amber-100/50" />
            <MiniStat label={t.cancelled} value={data.contracts.cancelled} icon={<XCircle className="h-4 w-4 text-red-600" />} color="bg-red-50 ring-1 ring-red-100/50" />
            <MiniStat label={t.today} value={data.contracts.today} icon={<TrendingUp className="h-4 w-4 text-sky-600" />} color="bg-sky-50 ring-1 ring-sky-100/50" />
          </div>
        </div>

        {/* Invoices Breakdown */}
        <div className="card p-6">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 pb-3 border-b border-slate-100">
            <Receipt className="h-4 w-4 text-emerald-600" />
            {t.invoicesBreakdown}
          </h3>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MiniStat label={t.paid} value={data.invoices.paid} icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />} color="bg-emerald-50 ring-1 ring-emerald-100/50" />
            <MiniStat label={t.open} value={data.invoices.open} icon={<AlertCircle className="h-4 w-4 text-amber-600" />} color="bg-amber-50 ring-1 ring-amber-100/50" />
            <MiniStat label={t.cancelled} value={data.invoices.cancelled} icon={<XCircle className="h-4 w-4 text-red-600" />} color="bg-red-50 ring-1 ring-red-100/50" />
            <MiniStat label={t.today} value={data.invoices.today} icon={<TrendingUp className="h-4 w-4 text-sky-600" />} color="bg-sky-50 ring-1 ring-sky-100/50" />
          </div>
        </div>
      </div>

      {/* Repair Orders Breakdown */}
      <div className="card p-6">
        <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 pb-3 border-b border-slate-100">
          <Wrench className="h-4 w-4 text-amber-600" />
          {t.repairsBreakdown}
        </h3>
        <div className="mt-4 grid grid-cols-1 min-[400px]:grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <MiniStat label={t.received} value={data.repairOrders.received} icon={<Clock className="h-4 w-4 text-sky-600" />} color="bg-sky-50 ring-1 ring-sky-100/50" />
          <MiniStat label={t.inProgress} value={data.repairOrders.inProgress} icon={<Wrench className="h-4 w-4 text-amber-600" />} color="bg-amber-50 ring-1 ring-amber-100/50" />
          <MiniStat label={t.ready} value={data.repairOrders.readyForPickup} icon={<AlertCircle className="h-4 w-4 text-violet-600" />} color="bg-violet-50 ring-1 ring-violet-100/50" />
          <MiniStat label={t.completed} value={data.repairOrders.completed} icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />} color="bg-emerald-50 ring-1 ring-emerald-100/50" />
          <MiniStat label={t.today} value={data.repairOrders.today} icon={<TrendingUp className="h-4 w-4 text-sky-600" />} color="bg-sky-50 ring-1 ring-sky-100/50" />
        </div>
      </div>

      {/* Recent Users */}
      <div className="card p-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <Users className="h-4 w-4 text-violet-600" />
            {t.recentUsers}
          </h3>
          <button
            onClick={() => navigate('/admin/users')}
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary-light"
          >
            {t.viewAll} <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">{t.thUser}</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">{t.thRole}</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">{t.thStatus}</th>
                <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400">{t.thContracts}</th>
                <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400">{t.thInvoices}</th>
                <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400">{t.thRepairs}</th>
                <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">{t.thJoined}</th>
              </tr>
            </thead>
            <tbody>
              {data.recentUsers.map((u) => (
                <tr
                  key={u.id}
                  onClick={() => navigate(`/admin/users/${u.id}`)}
                  className="cursor-pointer border-b border-slate-100 transition hover:bg-slate-50"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/10 to-indigo-500/10 text-[11px] font-bold text-violet-600">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{u.name}</p>
                        <p className="text-[11px] text-slate-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        u.role === 'admin'
                          ? 'bg-violet-50 text-violet-700 border border-violet-100'
                          : 'bg-sky-50 text-sky-700 border border-sky-100'
                      }`}
                    >
                      {u.role === 'admin' && <Shield className="h-3 w-3" />}
                      {u.role === 'admin' ? 'Admin' : (isDe ? 'Mitarbeiter' : 'Staff')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        u.isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : 'bg-red-50 text-red-700 border border-red-100'
                      }`}
                    >
                      {u.isActive ? t.active : t.inactive}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-sm font-semibold text-slate-600">{u._count.contracts}</td>
                  <td className="px-4 py-3 text-center text-sm font-semibold text-slate-600">{u._count.invoices}</td>
                  <td className="px-4 py-3 text-center text-sm font-semibold text-slate-600">{u._count.repairOrders}</td>
                  <td className="px-4 py-3 text-right text-xs text-slate-500">
                    {formatDate(u.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
