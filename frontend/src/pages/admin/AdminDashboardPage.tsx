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
  const { t, language, interpolate, formatMoney } = useLanguage()
  const locale = language === 'de' ? 'de-DE' : 'en-US'

  useEffect(() => {
    fetchAdminDashboard()
      .then(setData)
      .catch((err) => setError(err.message || t.admin.loadDashboardFailed))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          <p className="text-sm font-medium text-slate-500">{t.admin.loadingDashboard}</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-8 py-6 text-center">
          <XCircle className="mx-auto h-8 w-8 text-red-500" />
          <p className="mt-3 text-sm font-medium text-red-700">{error || t.admin.loadDashboardFailed}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">{t.admin.dashboardTitle}</h1>
        <p className="mt-1 text-sm text-slate-500">{t.admin.dashboardSubtitle}</p>
      </div>

      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title={t.admin.totalUsers}
          value={data.users.total}
          subtitle={interpolate(t.admin.usersActiveInactive, {
            active: data.users.active,
            inactive: data.users.inactive,
          })}
          icon={<Users className="h-5 w-5 text-violet-600" />}
          iconBg="bg-violet-50 ring-1 ring-violet-100/50"
        />
        <StatCard
          title={t.admin.totalContracts}
          value={data.contracts.total}
          subtitle={interpolate(t.admin.contractsTodayDrafts, {
            today: data.contracts.today,
            draft: data.contracts.draft,
          })}
          icon={<FileText className="h-5 w-5 text-sky-600" />}
          iconBg="bg-sky-50 ring-1 ring-sky-100/50"
        />
        <StatCard
          title={t.admin.totalInvoices}
          value={data.invoices.total}
          subtitle={interpolate(t.admin.invoicesTodayOpen, {
            today: data.invoices.today,
            open: data.invoices.open,
          })}
          icon={<Receipt className="h-5 w-5 text-emerald-600" />}
          iconBg="bg-emerald-50 ring-1 ring-emerald-100/50"
        />
        <StatCard
          title={t.admin.repairOrders}
          value={data.repairOrders.total}
          subtitle={interpolate(t.admin.repairsTodayInProgress, {
            today: data.repairOrders.today,
            inProgress: data.repairOrders.inProgress,
          })}
          icon={<Wrench className="h-5 w-5 text-amber-600" />}
          iconBg="bg-amber-50 ring-1 ring-amber-100/50"
        />
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title={t.admin.totalRevenue}
          value={formatMoney(data.invoices.totalRevenue)}
          subtitle={t.admin.revenueSubtitle}
          icon={<DollarSign className="h-5 w-5 text-emerald-600" />}
          iconBg="bg-emerald-50 ring-1 ring-emerald-100/50"
        />
        <StatCard
          title={t.admin.todayRevenue}
          value={formatMoney(data.invoices.todayRevenue)}
          subtitle={t.admin.revenueTodaySubtitle}
          icon={<TrendingUp className="h-5 w-5 text-sky-600" />}
          iconBg="bg-sky-50 ring-1 ring-sky-100/50"
        />
        <StatCard
          title={t.admin.totalPurchases}
          value={formatMoney(data.contracts.totalPurchaseAmount)}
          subtitle={t.admin.contractsSubtitle}
          icon={<FileText className="h-5 w-5 text-violet-600" />}
          iconBg="bg-violet-50 ring-1 ring-violet-100/50"
        />
        <StatCard
          title={t.admin.todayPurchases}
          value={formatMoney(data.contracts.todayPurchaseAmount)}
          subtitle={t.admin.contractsTodaySubtitle}
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
            {t.admin.usersBreakdown}
          </h3>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <MiniStat label={t.admin.statAdmins} value={data.users.admins} icon={<Shield className="h-4 w-4 text-violet-600" />} color="bg-violet-50 ring-1 ring-violet-100/50" />
            <MiniStat label={t.admin.statStaff} value={data.users.staff} icon={<UserCog className="h-4 w-4 text-sky-600" />} color="bg-sky-50 ring-1 ring-sky-100/50" />
            <MiniStat label={t.admin.active} value={data.users.active} icon={<UserCheck className="h-4 w-4 text-emerald-600" />} color="bg-emerald-50 ring-1 ring-emerald-100/50" />
            <MiniStat label={t.admin.inactive} value={data.users.inactive} icon={<UserX className="h-4 w-4 text-red-600" />} color="bg-red-50 ring-1 ring-red-100/50" />
          </div>
        </div>

        {/* Contracts Breakdown */}
        <div className="card p-6">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 pb-3 border-b border-slate-100">
            <FileText className="h-4 w-4 text-sky-600" />
            {t.admin.contractsBreakdown}
          </h3>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <MiniStat label={t.admin.statCompleted} value={data.contracts.completed} icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />} color="bg-emerald-50 ring-1 ring-emerald-100/50" />
            <MiniStat label={t.admin.statDraft} value={data.contracts.draft} icon={<Clock className="h-4 w-4 text-amber-600" />} color="bg-amber-50 ring-1 ring-amber-100/50" />
            <MiniStat label={t.admin.statCancelled} value={data.contracts.cancelled} icon={<XCircle className="h-4 w-4 text-red-600" />} color="bg-red-50 ring-1 ring-red-100/50" />
            <MiniStat label={t.admin.statToday} value={data.contracts.today} icon={<TrendingUp className="h-4 w-4 text-sky-600" />} color="bg-sky-50 ring-1 ring-sky-100/50" />
          </div>
        </div>

        {/* Invoices Breakdown */}
        <div className="card p-6">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 pb-3 border-b border-slate-100">
            <Receipt className="h-4 w-4 text-emerald-600" />
            {t.admin.invoicesBreakdown}
          </h3>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <MiniStat label={t.admin.statPaid} value={data.invoices.paid} icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />} color="bg-emerald-50 ring-1 ring-emerald-100/50" />
            <MiniStat label={t.admin.statOpen} value={data.invoices.open} icon={<AlertCircle className="h-4 w-4 text-amber-600" />} color="bg-amber-50 ring-1 ring-amber-100/50" />
            <MiniStat label={t.admin.statCancelled} value={data.invoices.cancelled} icon={<XCircle className="h-4 w-4 text-red-600" />} color="bg-red-50 ring-1 ring-red-100/50" />
            <MiniStat label={t.admin.statToday} value={data.invoices.today} icon={<TrendingUp className="h-4 w-4 text-sky-600" />} color="bg-sky-50 ring-1 ring-sky-100/50" />
          </div>
        </div>
      </div>

      {/* Repair Orders Breakdown */}
      <div className="card p-6">
        <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 pb-3 border-b border-slate-100">
          <Wrench className="h-4 w-4 text-amber-600" />
          {t.admin.repairOrdersBreakdown}
        </h3>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <MiniStat label={t.admin.statReceived} value={data.repairOrders.received} icon={<Clock className="h-4 w-4 text-sky-600" />} color="bg-sky-50 ring-1 ring-sky-100/50" />
          <MiniStat label={t.admin.statInProgress} value={data.repairOrders.inProgress} icon={<Wrench className="h-4 w-4 text-amber-600" />} color="bg-amber-50 ring-1 ring-amber-100/50" />
          <MiniStat label={t.admin.statReady} value={data.repairOrders.readyForPickup} icon={<AlertCircle className="h-4 w-4 text-violet-600" />} color="bg-violet-50 ring-1 ring-violet-100/50" />
          <MiniStat label={t.admin.statCompleted} value={data.repairOrders.completed} icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />} color="bg-emerald-50 ring-1 ring-emerald-100/50" />
          <MiniStat label={t.admin.statToday} value={data.repairOrders.today} icon={<TrendingUp className="h-4 w-4 text-sky-600" />} color="bg-sky-50 ring-1 ring-sky-100/50" />
        </div>
      </div>

      {/* Recent Users */}
      <div className="card p-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <Users className="h-4 w-4 text-violet-600" />
            {t.admin.recentUsers}
          </h3>
          <button
            onClick={() => navigate('/admin/users')}
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary-light"
          >
            {t.admin.viewAll} <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">{t.admin.user}</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">{t.admin.role}</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">{t.admin.status}</th>
                <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400">{t.admin.contracts}</th>
                <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400">{t.admin.invoices}</th>
                <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400">{t.admin.repairs}</th>
                <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">{t.admin.joined}</th>
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
                      {u.role === 'admin' ? t.admin.roleAdmin : t.admin.roleStaff}
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
                      {u.isActive ? t.admin.active : t.admin.inactive}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-sm font-semibold text-slate-600">{u._count.contracts}</td>
                  <td className="px-4 py-3 text-center text-sm font-semibold text-slate-600">{u._count.invoices}</td>
                  <td className="px-4 py-3 text-center text-sm font-semibold text-slate-600">{u._count.repairOrders}</td>
                  <td className="px-4 py-3 text-right text-xs text-slate-500">
                    {new Date(u.createdAt).toLocaleDateString(locale)}
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
