import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import type { Language } from '../../i18n/types'
import type { RepairOrder } from '../../types/repairOrder'
import type { SparePart } from '../../types/inventory'
import { getDeviceCategoryImage } from '../../utils/categoryImageMap'

/* ------------------------------------------------------------------ */
/* Assets                                                              */
/* ------------------------------------------------------------------ */

const HERO_LAPTOP = '/assets/dashboard-hero-laptop.png'

const ICON_PLUS_WHITE = '/assets/icon-plus-white.svg'

const STAT_REPAIR = '/assets/stat-repair.svg'
const STAT_LOW_STOCK = '/assets/stat-low-stock.svg'
const STAT_QUOTES = '/assets/stat-quotes.svg'
const STAT_COMPLETED = '/assets/stat-completed.svg'

const PIPELINE_INTAKE = '/assets/pipeline-intake.svg'
const PIPELINE_QUOTE = '/assets/pipeline-quote.svg'
const PIPELINE_PURCHASE = '/assets/pipeline-purchase.svg'
const PIPELINE_SUPPORT = '/assets/pipeline-support.svg'
const PIPELINE_INVOICE = '/assets/pipeline-invoice.svg'
const PIPELINE_ARROW = '/assets/pipeline-arrow.svg'

const PRIORITY_URGENT = '/assets/priority-urgent.svg'
const PRIORITY_READY = '/assets/priority-ready.svg'
const PRIORITY_WAITING = '/assets/priority-waiting.svg'
const PRIORITY_APPOINTMENT = '/assets/priority-appointment.svg'

const CONTACT_PHONE = '/assets/contact-phone.svg'
const CONTACT_MAIL = '/assets/contact-mail.svg'
const CONTACT_COPY = '/assets/contact-copy.svg'
const CONTACT_WHATSAPP = '/assets/contact-whatsapp.svg'

const ICON_ARROW_RIGHT_SMALL = '/assets/icon-arrow-right-small.svg'

/* ------------------------------------------------------------------ */
/* Localization                                                        */
/* ------------------------------------------------------------------ */

export function dashboardLocale(language: Language) {
  const de = language === 'de'
  return {
    welcomeTitle: de ? 'Willkommen zurück, {name}!' : 'Welcome back, {name}!',
    welcomeSubtitle: de
      ? 'Das passiert heute in Ihrer Werkstatt.'
      : "Here is what's happening in your workshop today.",
    quickCommand: 'Quick Command Center',
    priorityTitle: de ? 'Heute Wichtig' : 'Important Today',
    urgentRepairs: de ? 'Dringende Reparaturen' : 'Urgent repairs',
    readyForPickup: de ? 'Bereit zur Abholung' : 'Ready for pickup',
    customersWaiting: de ? 'Kunden warten auf eine Antwort' : 'Customers awaiting response',
    todayAppointments: de ? 'Heute Termine' : "Today's appointments",
    liveRepairsTitle: de ? 'Reparaturarbeiten in Echtzeit' : 'Live repair work',
    colDevice: de ? 'Gerät' : 'Device',
    colCustomer: de ? 'Kunde' : 'Customer',
    colIssue: de ? 'Ausgabe' : 'Issue',
    colStatus: 'Status',
    colEta: 'ETA',
    viewAll: de ? 'Alle anzeigen' : 'View all',
    noRepairs: de ? 'Keine aktiven Reparaturen.' : 'No active repairs.',
    noContacts: de ? 'Keine Kontakte verfügbar.' : 'No contacts available.',
    noLowStock: de ? 'Alle Teile ausreichend auf Lager.' : 'All parts sufficiently stocked.',
    statDevicesInRepair: de ? 'Gerät in Reparatur' : 'Devices in repair',
    statPartsLow: de ? 'Teile niedrig' : 'Parts low',
    statQuotesPending: de ? 'Angebot ausstehend' : 'Quotes pending',
    statCompleted: de ? 'vollendet' : 'Completed',
    newToday: de ? '{n} heute neu' : '{n} new today',
    showAllArrow: de ? 'Alle anzeigen' : 'View all',
    todayDoneSub: de ? 'Heute abgeschlossen' : 'Completed today',
    partsWarningTitle: de ? 'Teilewarnung' : 'Parts warning',
    stock: de ? 'Stock' : 'Stock',
    today: de ? 'Heute' : 'Today',
    pipelineTitle: de ? 'Reparaturarbeiten in Echtzeit' : 'Workshop pipeline',
    stepIntake: de ? 'Einlass reparieren' : 'Repair intake',
    stepIntakeSub: de ? '{n} neue Check-ins' : '{n} new check-ins',
    stepQuote: de ? 'Angebotsanfrage' : 'Quote requests',
    stepQuoteSub: de ? '{n} Ausstehend' : '{n} Pending',
    stepPurchase: de ? 'Gerätekäufe' : 'Device purchases',
    stepPurchaseSub: de ? '{n} Ausstehend' : '{n} Pending',
    stepSupport: de ? 'Kundenbetreuung' : 'Customer support',
    stepSupportSub: de ? '{n} Ausstehend' : '{n} Pending',
    stepInvoice: de ? 'Rechnungsaktion' : 'Invoicing',
    stepInvoiceSub: de ? '{n} Ausstehend' : '{n} Pending',
    copied: de ? 'Telefonnummer kopiert' : 'Phone number copied',
    vsYesterday: de ? 'vs Gestern' : 'vs Yesterday',
  }
}

export type DashboardLocale = ReturnType<typeof dashboardLocale>

const fill = (text: string, vars: Record<string, string | number>) =>
  Object.entries(vars).reduce((acc, [k, v]) => acc.replaceAll(`{${k}}`, String(v)), text)

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function deviceLabel(order: Pick<RepairOrder, 'brand' | 'model' | 'deviceType'>) {
  return [order.brand, order.model].filter(Boolean).join(' ') || order.deviceType || '—'
}

/* ------------------------------------------------------------------ */
/* Shared card shell                                                   */
/* ------------------------------------------------------------------ */

function CardShell({
  title,
  action,
  children,
  className,
  bodyClassName,
}: {
  title: string
  action?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
}) {
  return (
    <section className={clsx('card flex flex-col', className)}>
      <div className="flex items-center justify-between gap-3 px-5 pt-6 pb-4">
        <h2 className="text-base font-semibold text-[#0b0b0b]">{title}</h2>
        {action}
      </div>
      <div className={clsx('flex-1', bodyClassName ?? 'px-5 pb-6')}>{children}</div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* 1. Welcome banner                                                   */
/* ------------------------------------------------------------------ */

export function WelcomeBanner({
  loc,
  userName,
  to,
  className,
}: {
  loc: DashboardLocale
  userName: string
  to: string
  className?: string
}) {
  return (
    <section
      className={clsx(
        'relative h-[240px] overflow-hidden rounded-dashboard-card border border-black/10 bg-[#F8F3F2]',
        className,
      )}
    >
      <div className="absolute top-[159px] left-0 h-[67px] w-[25px] bg-[#7c9edb] opacity-30 blur-[51px] rounded-r-md" />
      
      <div className="relative z-10 flex flex-col justify-center h-full pl-8 pr-56 lg:pr-80">
        <h1 className="text-xl font-medium tracking-tight text-[#0b0b0b] sm:text-2xl">
          {fill(loc.welcomeTitle, { name: userName })}
        </h1>
        <p className="mt-1 text-sm text-[#0b0b0b]/60">{loc.welcomeSubtitle}</p>
        
        <Link
          to={to}
          className="mt-6 flex w-fit items-center gap-2 rounded-lg bg-[#1f1b4d] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#272260]"
        >
          <img src={ICON_PLUS_WHITE} alt="" className="h-4 w-4" />
          {loc.quickCommand}
        </Link>
      </div>
      
      <div className="absolute top-0 right-0 h-full w-[320px] lg:w-[400px]">
        <img
          src={HERO_LAPTOP}
          alt=""
          className="h-full w-full object-contain object-right drop-shadow-hero-laptop"
        />
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* 2. Priority list — "Heute Wichtig"                                  */
/* ------------------------------------------------------------------ */

export type PriorityItem = {
  key: string
  icon: string
  label: string
  count: number
  to: string
}

export function buildPriorityItems(
  loc: DashboardLocale,
  counts: { urgent: number; ready: number; waiting: number; appointments: number },
): PriorityItem[] {
  return [
    {
      key: 'urgent',
      icon: PRIORITY_URGENT,
      label: loc.urgentRepairs,
      count: counts.urgent,
      to: '/repair-orders',
    },
    {
      key: 'ready',
      icon: PRIORITY_READY,
      label: loc.readyForPickup,
      count: counts.ready,
      to: '/repair-orders',
    },
    {
      key: 'waiting',
      icon: PRIORITY_WAITING,
      label: loc.customersWaiting,
      count: counts.waiting,
      to: '/repair-orders',
    },
    {
      key: 'appointments',
      icon: PRIORITY_APPOINTMENT,
      label: loc.todayAppointments,
      count: counts.appointments,
      to: '/calendar',
    },
  ]
}

export function PriorityCard({ loc, items }: { loc: DashboardLocale; items: PriorityItem[] }) {
  return (
    <CardShell title={loc.priorityTitle} bodyClassName="px-5 pb-5 pt-2">
      <ul className="space-y-0">
        {items.map((item, idx) => (
          <li key={item.key}>
            <Link
              to={item.to}
              className="flex items-center gap-4 py-3.5 transition hover:opacity-80"
            >
              <img src={item.icon} alt="" className="h-[26px] w-[26px] shrink-0" />
              <span className="flex-1 text-[13px] font-medium text-[#0b0b0b]">
                {item.label}
              </span>
              <span className="text-[13px] font-medium text-[#000000]">
                {item.count}
              </span>
            </Link>
            {idx < items.length - 1 && (
              <div className="h-px bg-black/10" />
            )}
          </li>
        ))}
      </ul>
    </CardShell>
  )
}

/* ------------------------------------------------------------------ */
/* 3. Live repairs table                                               */
/* ------------------------------------------------------------------ */

export function LiveRepairsCard({
  loc,
  orders,
  statusLabel,
  formatEta,
  className,
}: {
  loc: DashboardLocale
  orders: RepairOrder[]
  statusLabel: (status: RepairOrder['status']) => string
  formatEta: (order: RepairOrder) => string
  className?: string
}) {
  const getStatusColor = (status: RepairOrder['status']) => {
    switch (status) {
      case 'Open':
      case 'WorkPending':
      case 'SentToRepairCompany':
      case 'AppointmentScheduled':
      case 'SparePartArrived':
        return 'text-status-progress bg-status-progress/10'
      case 'WaitingForCustomerFeedback':
        return 'text-status-waiting bg-status-waiting/10'
      case 'Completed':
        return 'text-emerald-600 bg-emerald-600/10'
      default:
        return 'text-slate-600 bg-slate-100'
    }
  }

  return (
    <CardShell
      title={loc.liveRepairsTitle}
      bodyClassName="p-0"
      className={className}
    >
      {orders.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-[#0b0b0b]/40">{loc.noRepairs}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left border-collapse">
            <thead>
              <tr className="text-[13px] font-medium text-[#0b0b0b]/70">
                <th className="pl-6 pr-3 py-4 font-medium">{loc.colDevice}</th>
                <th className="px-3 py-4 font-medium">{loc.colCustomer}</th>
                <th className="px-3 py-4 font-medium">{loc.colIssue}</th>
                <th className="px-3 py-4 font-medium">{loc.colStatus}</th>
                <th className="pl-3 pr-6 py-4 font-medium">{loc.colEta}</th>
              </tr>
            </thead>
            <tbody className="before:block before:h-px before:bg-black/10 before:mx-6">
              {orders.map((order) => (
                <tr key={order.id} className="relative transition hover:bg-slate-50/50 after:absolute after:left-6 after:right-6 after:bottom-0 after:h-px after:bg-black/10 last:after:hidden">
                  <td className="pl-6 pr-3 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={getDeviceCategoryImage(order.brand, order.model, order.deviceType)}
                        alt=""
                        className="h-10 w-10 shrink-0 rounded-lg object-cover"
                      />
                      <span className="text-[13px] font-medium text-[#0b0b0b]">
                        {deviceLabel(order)}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    <span className="text-[13px] font-medium text-[#0b0b0b]">
                      {order.customerName || '—'}
                    </span>
                  </td>
                  <td className="px-3 py-4">
                    <span className="text-[13px] font-medium text-[#0b0b0b]">
                      {order.problemDescription || '—'}
                    </span>
                  </td>
                  <td className="px-3 py-4">
                    <span className={clsx(
                      'inline-block rounded-[23px] px-2.5 py-1 text-[13px] font-medium',
                      getStatusColor(order.status)
                    )}>
                      {statusLabel(order.status)}
                    </span>
                  </td>
                  <td className="pl-3 pr-6 py-4">
                    <span className="text-[13px] font-medium text-[#0b0b0b]">
                      {formatEta(order)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </CardShell>
  )
}

/* ------------------------------------------------------------------ */
/* 4. Customer contact card                                            */
/* ------------------------------------------------------------------ */

export type ContactPerson = {
  id: string
  name: string
  phone: string
  email?: string | null
}

export function ContactCard({
  loc,
  people,
  onCopy,
}: {
  loc: DashboardLocale
  people: ContactPerson[]
  onCopy: (value: string) => void
}) {
  const digits = (phone: string) => phone.replace(/[^\d]/g, '')
  const actionBtn = 'h-[34px] w-[34px] flex items-center justify-center transition hover:opacity-80'

  return (
    <CardShell
      title={loc.priorityTitle}
      action={
        <Link to="/repair-orders" className="text-[10px] font-medium text-black/40 hover:text-black/60">
          {loc.viewAll}
        </Link>
      }
      bodyClassName="px-5 pb-5 pt-2"
    >
      {people.length === 0 ? (
        <p className="px-2 py-8 text-center text-sm text-[#0b0b0b]/40">{loc.noContacts}</p>
      ) : (
        <ul className="space-y-4">
          {people.map((person) => (
            <li
              key={person.id}
              className="flex items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#1a202c]">{person.name}</p>
                <p className="truncate text-[11px] text-[#94a3b8]">{person.phone || '—'}</p>
              </div>
              
              <div className="flex shrink-0 items-center gap-[11px]">
                {person.phone && (
                  <a className={actionBtn} href={`tel:${person.phone}`}>
                    <img src={CONTACT_PHONE} alt="Call" className="h-full w-full" />
                  </a>
                )}
                {person.email && (
                  <a className={actionBtn} href={`mailto:${person.email}`}>
                    <img src={CONTACT_MAIL} alt="Email" className="h-full w-full" />
                  </a>
                )}
                <button
                  type="button"
                  className={actionBtn}
                  onClick={() => onCopy(person.phone)}
                >
                  <img src={CONTACT_COPY} alt="Copy" className="h-full w-full" />
                </button>
                {person.phone && (
                  <a
                    className={actionBtn}
                    href={`https://wa.me/${digits(person.phone)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <img src={CONTACT_WHATSAPP} alt="WhatsApp" className="h-full w-full" />
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </CardShell>
  )
}

/* ------------------------------------------------------------------ */
/* 5. Metric (stat) card                                               */
/* ------------------------------------------------------------------ */

export function MetricCard(props: {
  icon: string
  title: string
  value: string
  sub?: string
  subTrend?: string
  to?: string
  testId?: string
}) {
  const inner = (
    <div className="flex flex-col p-6 h-full">
      <img src={props.icon} alt="" className="h-12 w-12" />
      <p className="mt-4 text-[13px] font-medium text-[#000000]">{props.title}</p>
      <p className="mt-2 text-[32px] font-medium leading-none text-[#000000]">{props.value}</p>

      {(props.subTrend || props.sub) && (
        <div className="mt-4 flex items-center gap-1">
          {props.subTrend ? (
            <>
              <span className={clsx(
                'text-[11px] font-medium',
                props.subTrend.includes('+') ? 'text-[#059669]' : 'text-[#e54649]'
              )}>
                {props.subTrend}
              </span>
              <span className="text-[11px] font-medium text-black/50">vs Gestern</span>
            </>
          ) : (
            <span className="flex items-center gap-1 text-[11px] font-medium text-[#000000]">
              {props.sub}
              <img src={ICON_ARROW_RIGHT_SMALL} alt="" className="h-[7px] w-[8px]" />
            </span>
          )}
        </div>
      )}
    </div>
  )

  if (props.to) {
    return (
      <Link to={props.to} data-testid={props.testId} className="card transition hover:opacity-90">
        {inner}
      </Link>
    )
  }
  return <div data-testid={props.testId} className="card">{inner}</div>
}

/* ------------------------------------------------------------------ */
/* 6. Low stock (parts warning) card                                   */
/* ------------------------------------------------------------------ */

export function LowStockCard({ loc, parts }: { loc: DashboardLocale; parts: SparePart[] }) {
  return (
    <CardShell
      title={loc.partsWarningTitle}
      action={
        <Link to="/inventory/parts" className="text-[10px] font-medium text-black/40 hover:text-black/60">
          {loc.viewAll}
        </Link>
      }
      bodyClassName="px-5 pb-5 pt-2"
    >
      {parts.length === 0 ? (
        <p className="px-2 py-8 text-center text-sm text-[#0b0b0b]/40">{loc.noLowStock}</p>
      ) : (
        <ul className="space-y-0">
          {parts.map((part, idx) => (
            <li key={part.id}>
              <Link
                to="/inventory/parts"
                className="flex items-center justify-between gap-4 py-4 transition hover:opacity-80"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={getDeviceCategoryImage(part.name, part.compatibility, part.category)}
                    alt=""
                    className="h-10 w-10 shrink-0 rounded-lg object-cover"
                  />
                  <span className="truncate text-[13px] font-medium text-[#0b0b0b]">
                    {part.name}
                  </span>
                </div>
                <span className="shrink-0 text-[13px] font-medium text-[#e54649]">
                  {loc.stock}: {part.stock}
                </span>
              </Link>
              {idx < parts.length - 1 && (
                <div className="h-px bg-black/10" />
              )}
            </li>
          ))}
        </ul>
      )}
    </CardShell>
  )
}

/* ------------------------------------------------------------------ */
/* 7. Workflow pipeline                                                */
/* ------------------------------------------------------------------ */

export type PipelineStep = {
  key: string
  icon: string
  label: string
  sub: string
  to: string
}

export function buildPipelineSteps(
  loc: DashboardLocale,
  counts: { intake: number; quotes: number; purchases: number; support: number; invoicing: number },
): PipelineStep[] {
  return [
    {
      key: 'intake',
      icon: PIPELINE_INTAKE,
      label: loc.stepIntake,
      sub: fill(loc.stepIntakeSub, { n: counts.intake }),
      to: '/repair-orders',
    },
    {
      key: 'quote',
      icon: PIPELINE_QUOTE,
      label: loc.stepQuote,
      sub: fill(loc.stepQuoteSub, { n: counts.quotes }),
      to: '/quotations',
    },
    {
      key: 'purchase',
      icon: PIPELINE_PURCHASE,
      label: loc.stepPurchase,
      sub: fill(loc.stepPurchaseSub, { n: counts.purchases }),
      to: '/contracts',
    },
    {
      key: 'support',
      icon: PIPELINE_SUPPORT,
      label: loc.stepSupport,
      sub: fill(loc.stepSupportSub, { n: counts.support }),
      to: '/repair-orders',
    },
    {
      key: 'invoice',
      icon: PIPELINE_INVOICE,
      label: loc.stepInvoice,
      sub: fill(loc.stepInvoiceSub, { n: counts.invoicing }),
      to: '/invoices',
    },
  ]
}

/** Tinted tile background per pipeline step, matching the Figma reference. */
const PIPELINE_STEP_BG: Record<string, string> = {
  intake: 'bg-[#ECEAFB]',
  quote: 'bg-[#FBF1E4]',
  purchase: 'bg-[#E9EFFB]',
  support: 'bg-[#FBF1E4]',
  invoice: 'bg-[#FBE9E9]',
}

export function WorkflowCard({
  loc,
  steps,
  className,
}: {
  loc: DashboardLocale
  steps: PipelineStep[]
  className?: string
}) {
  return (
    <CardShell title={loc.pipelineTitle} className={className} bodyClassName="px-5 pb-6 pt-2">
      <div className="flex items-stretch gap-2">
        {steps.map((step, index) => (
          <div key={step.key} className="flex flex-1 items-center gap-2">
            <Link
              to={step.to}
              className={clsx(
                'flex flex-1 flex-col items-center justify-center gap-2 rounded-2xl px-3 py-6 text-center transition hover:opacity-90',
                PIPELINE_STEP_BG[step.key] ?? 'bg-slate-50',
              )}
            >
              <img src={step.icon} alt="" className="h-[26px] w-[26px]" />
              <span className="mt-1 text-[13px] font-semibold leading-tight text-[#0b0b0b]">
                {step.label}
              </span>
              <span className="text-[11px] font-medium leading-tight text-black/45">
                {step.sub}
              </span>
            </Link>
            {index < steps.length - 1 && (
              <img src={PIPELINE_ARROW} alt="" className="h-3 w-4 shrink-0" />
            )}
          </div>
        ))}
      </div>
    </CardShell>
  )
}

/* Re-export icons mapped to Figma paths */
export const Wrench = STAT_REPAIR
export const Package = STAT_LOW_STOCK
export const Receipt = STAT_QUOTES
export const PackageCheck = STAT_COMPLETED
