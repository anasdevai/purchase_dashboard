import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  listRepairRequests,
  updateRepairRequestStatus,
  convertRepairRequestToOrder,
} from '../../api/repairRequests.js'
import type { RepairRequest } from '../../api/repairRequests.js'
import { getApiBaseUrl } from '../../api/client.js'
import { useAppConfirm } from '../../components/common/ConfirmDialogProvider'
import { useLanguage } from '../../i18n/LanguageProvider'
import {
  Inbox,
  Eye,
  PhoneCall,
  Wrench,
  Calendar,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  CheckCircle,
  ExternalLink,
  Clock
} from 'lucide-react'

export default function IncomingRequestsPage() {
  const navigate = useNavigate()
  const { showToast } = useAppConfirm()
  const { language } = useLanguage()
  const isDe = language === 'de'

  const [requests, setRequests] = useState<RepairRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('All')
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const loadRequests = async () => {
    try {
      setLoading(true)
      const apiFilter = filterStatus === 'All' ? undefined : filterStatus
      const data = await listRepairRequests(apiFilter)
      setRequests(data)
    } catch (err: any) {
      console.error(err)
      showToast('error', err.message || (isDe ? 'Website-Reparaturanfragen konnten nicht geladen werden.' : 'Failed to load repair requests.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRequests()
  }, [filterStatus])

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      setActionLoading(id)
      await updateRepairRequestStatus(id, newStatus)
      
      const statusLabel = newStatus === 'Seen' ? (isDe ? 'Gesehen' : 'Seen') : newStatus === 'Contacted' ? (isDe ? 'Kontaktiert' : 'Contacted') : newStatus
      showToast('success', isDe ? `Ticket-Status auf "${statusLabel}" aktualisiert` : `Ticket updated to ${newStatus}`)
      
      // Update local state
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newStatus as any } : r))
      )
    } catch (err: any) {
      console.error(err)
      showToast('error', err.message || (isDe ? 'Ticketstatus konnte nicht aktualisiert werden.' : 'Failed to update ticket status.'))
    } finally {
      setActionLoading(null)
    }
  }

  const handleConvert = async (id: string) => {
    try {
      setActionLoading(id)
      const createdOrder = await convertRepairRequestToOrder(id)
      showToast('success', isDe ? 'Erfolgreich in Live-Reparaturauftrag umgewandelt!' : 'Successfully converted to Live Repair Order!')
      
      // Navigate directly to the newly created repair order detail page
      navigate(`/repair-orders/${createdOrder.id}`)
    } catch (err: any) {
      console.error(err)
      showToast('error', err.message || (isDe ? 'Anfrage konnte nicht in einen Auftrag umgewandelt werden.' : 'Failed to convert request to order.'))
    } finally {
      setActionLoading(null)
    }
  }

  const toggleExpand = (id: string) => {
    setExpandedRequestId((prev) => (prev === id ? null : id))
  }

  const t = {
    title: isDe ? 'Website-Reparaturanfragen' : 'Website Repair Requests',
    subtitle: isDe ? 'Überprüfen und verwalten Sie online von Kunden eingereichte Reparaturanfragen.' : 'Review and manage repair bookings submitted online by public customers.',
    newTickets: isDe ? 'Neue Tickets' : 'New Tickets',
    activePending: isDe ? 'Aktiv / Ausstehend' : 'Active / Pending',
    conversionRate: isDe ? 'Konversionsrate' : 'Conversion Rate',
    loading: isDe ? 'Anfragen werden geladen...' : 'Loading request tickets...',
    noRequestsTitle: isDe ? 'Keine Anfragen gefunden' : 'No Requests Found',
    noRequestsSub: isDe ? 'Es wurden keine Website-Reparaturanfragen gefunden, die dem Filter entsprechen.' : 'There are no website repair request tickets matching the selected filter.',
    device: isDe ? 'Gerät' : 'Device',
    requestedRepair: isDe ? 'Angeforderte Reparatur' : 'Requested Repair',
    issueDescription: isDe ? 'Problembeschreibung' : 'Issue Description',
    preferredSlot: isDe ? 'Bevorzugter Termin/Zeitfenster:' : 'Preferred Date/Time Slot:',
    damagePhoto: isDe ? 'Schadensfoto' : 'Damage Photo File',
    viewFullsize: isDe ? 'Vollbild anzeigen' : 'View Fullsize',
    customerContact: isDe ? 'Kunden-Kontaktdaten' : 'Customer Contact Info',
    emailLabel: isDe ? 'E-Mail:' : 'Email:',
    phoneLabel: isDe ? 'Telefon:' : 'Phone:',
    markSeen: isDe ? 'Als gesehen markieren' : 'Mark as Seen',
    markContacted: isDe ? 'Als kontaktiert markieren' : 'Mark as Contacted',
    convertBtn: isDe ? 'In Reparaturauftrag umwandeln' : 'Convert to Repair Order',
    processing: isDe ? 'In Arbeit...' : 'Processing...',
    successProcessed: isDe ? 'Erfolgreich verarbeitet' : 'Successfully Processed',
    successMapped: isDe ? 'Diese Anfrage wurde erfolgreich mit aktiven Datensätzen verknüpft:' : 'This request has been successfully mapped to active records:',
    goRepairOrder: isDe ? 'Zum Reparaturauftrag gehen' : 'Go to Repair Order',
    goCustomerProfile: isDe ? 'Zum Kundenprofil gehen' : 'Go to Customer Profile',
    allFilter: isDe ? 'Alle' : 'All',
    newFilter: isDe ? 'Neu' : 'New',
    seenFilter: isDe ? 'Gesehen' : 'Seen',
    contactedFilter: isDe ? 'Kontaktiert' : 'Contacted',
    completedFilter: isDe ? 'Abgeschlossen' : 'Completed',
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'New':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700">{isDe ? 'Neu' : 'New'}</span>
      case 'Seen':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">{isDe ? 'Gesehen' : 'Seen'}</span>
      case 'Contacted':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">{isDe ? 'Kontaktiert' : 'Contacted'}</span>
      case 'Completed':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">{isDe ? 'Abgeschlossen' : 'Completed'}</span>
      default:
        return null
    }
  }

  const totalNew = requests.filter(r => r.status === 'New').length
  const totalPending = requests.filter(r => r.status !== 'Completed').length

  const filterTabs = [
    { value: 'All', label: t.allFilter },
    { value: 'New', label: t.newFilter },
    { value: 'Seen', label: t.seenFilter },
    { value: 'Contacted', label: t.contactedFilter },
    { value: 'Completed', label: t.completedFilter },
  ]

  return (
    <div className="space-y-6">
      {/* Header and Stats */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl flex items-center gap-2">
            <Inbox className="w-7 h-7 text-primary" />
            {t.title}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {t.subtitle}
          </p>
        </div>
      </div>

      {/* Mini Stats Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="card px-5 py-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">{t.newTickets}</span>
            <div className="text-2xl font-black text-rose-600 mt-1">{totalNew}</div>
          </div>
          <Clock className="w-8 h-8 text-rose-200" />
        </div>
        <div className="card px-5 py-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">{t.activePending}</span>
            <div className="text-2xl font-black text-sky-600 mt-1">{totalPending}</div>
          </div>
          <Inbox className="w-8 h-8 text-sky-200" />
        </div>
        <div className="card px-5 py-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">{t.conversionRate}</span>
            <div className="text-2xl font-black text-emerald-600 mt-1">
              {requests.length > 0
                ? `${Math.round((requests.filter((r) => r.status === 'Completed').length / requests.length) * 100)}%`
                : '0%'}
            </div>
          </div>
          <CheckCircle className="w-8 h-8 text-emerald-200" />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-4">
        {filterTabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setFilterStatus(tab.value)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
              filterStatus === tab.value
                ? 'bg-primary text-white'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List / Table Container */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-slate-400 text-sm">{t.loading}</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-600 mb-1">{t.noRequestsTitle}</h3>
            <p className="text-xs">{t.noRequestsSub}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {requests.map((request) => {
              const isExpanded = expandedRequestId === request.id
              const isBusy = actionLoading === request.id

              return (
                <div key={request.id} className="transition hover:bg-slate-50/50">
                  
                  {/* Clickable Header Row */}
                  <div
                    onClick={() => toggleExpand(request.id)}
                    className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
                  >
                    <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <strong className="block text-sm font-bold text-slate-800 truncate">{request.customerName}</strong>
                        <span className="text-xs text-slate-400 block mt-0.5">{request.customerPhone}</span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 uppercase font-bold tracking-wide">{t.device}</span>
                        <strong className="block text-sm text-slate-800 mt-0.5 font-bold truncate">
                          {request.deviceBrand} {request.deviceModel}
                        </strong>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 uppercase font-bold tracking-wide">{t.requestedRepair}</span>
                        <span className="block text-sm text-slate-600 mt-0.5 truncate">{request.repairType}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {getStatusBadge(request.status)}
                      <span className="text-xs text-slate-400">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Detail Panel */}
                  {isExpanded && (
                    <div className="px-5 pb-6 pt-2 bg-slate-50 border-t border-slate-100/60 grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
                      
                      {/* Left: Metadata & Photos */}
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-xs uppercase font-bold text-slate-400 mb-1">{t.issueDescription}</h4>
                          <div className="bg-white rounded-xl p-4 border border-slate-200/50 text-sm text-slate-700 leading-relaxed shadow-sm">
                            {request.issueDescription}
                          </div>
                        </div>

                        {request.preferredAppointment && (
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span>{t.preferredSlot}</span>
                            <strong className="font-bold text-slate-800">
                              {new Date(request.preferredAppointment).toLocaleString()}
                            </strong>
                          </div>
                        )}

                        {request.photoPath && (
                          <div>
                            <h4 className="text-xs uppercase font-bold text-slate-400 mb-1.5 flex items-center gap-1">
                              <ImageIcon className="w-3.5 h-3.5" />
                              {t.damagePhoto}
                            </h4>
                            <div className="relative group max-w-sm rounded-xl overflow-hidden shadow-sm border border-slate-200 bg-white p-1.5">
                              <img
                                src={`${getApiBaseUrl()}/${request.photoPath}`}
                                alt="Client Uploaded Fault"
                                className="w-full h-44 object-cover rounded-lg"
                              />
                              <a
                                href={`${getApiBaseUrl()}/${request.photoPath}`}
                                target="_blank"
                                rel="noreferrer"
                                className="absolute bottom-3 right-3 bg-slate-900/80 hover:bg-slate-900 text-white rounded-full p-2 text-xs flex items-center gap-1 transition shadow"
                              >
                                <ExternalLink className="w-3 h-3" />
                                {t.viewFullsize}
                              </a>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right: Contact details and Conversion Actions */}
                      <div className="flex flex-col justify-between border-l border-slate-200/50 pl-0 lg:pl-6 space-y-6">
                        <div>
                          <h4 className="text-xs uppercase font-bold text-slate-400 mb-2">{t.customerContact}</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-slate-400 w-16">{t.emailLabel}</span>
                              <a href={`mailto:${request.customerEmail}`} className="text-primary font-semibold hover:underline">
                                {request.customerEmail}
                              </a>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-slate-400 w-16">{t.phoneLabel}</span>
                              <a href={`tel:${request.customerPhone}`} className="text-slate-800 font-semibold hover:underline">
                                {request.customerPhone}
                              </a>
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="space-y-3">
                          {request.status !== 'Completed' ? (
                            <div className="flex flex-wrap gap-2">
                              {request.status === 'New' && (
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => handleUpdateStatus(request.id, 'Seen')}
                                  className="btn btn-outline border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold px-4 py-2.5 h-10 flex items-center gap-1.5 rounded-xl disabled:opacity-60"
                                >
                                  <Eye className="w-4 h-4 text-blue-500" />
                                  {t.markSeen}
                                </button>
                              )}

                              {['New', 'Seen'].includes(request.status) && (
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => handleUpdateStatus(request.id, 'Contacted')}
                                  className="btn btn-outline border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold px-4 py-2.5 h-10 flex items-center gap-1.5 rounded-xl disabled:opacity-60"
                                >
                                  <PhoneCall className="w-4 h-4 text-amber-500" />
                                  {t.markContacted}
                                </button>
                              )}

                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handleConvert(request.id)}
                                className="btn btn-primary text-xs font-bold px-5 py-2.5 h-10 flex items-center gap-1.5 rounded-xl disabled:opacity-60"
                              >
                                <Wrench className="w-4 h-4" />
                                {isBusy ? t.processing : t.convertBtn}
                              </button>
                            </div>
                          ) : (
                            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-center gap-3">
                              <CheckCircle className="w-6 h-6 text-emerald-500 shrink-0" />
                              <div>
                                <h5 className="text-xs font-bold text-emerald-800">{t.successProcessed}</h5>
                                <p className="text-xs text-emerald-600 mt-0.5">
                                  {t.successMapped}
                                </p>
                                <div className="flex gap-4 mt-2">
                                  {request.repairOrderCreatedId && (
                                    <Link
                                      to={`/repair-orders/${request.repairOrderCreatedId}`}
                                      className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
                                    >
                                      {t.goRepairOrder}
                                      <ExternalLink className="w-3 h-3" />
                                    </Link>
                                  )}
                                  {request.customerCreatedId && (
                                    <Link
                                      to={`/customers/${request.customerCreatedId}`}
                                      className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
                                    >
                                      {t.goCustomerProfile}
                                      <ExternalLink className="w-3 h-3" />
                                    </Link>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                      </div>
                    </div>
                  )}

                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
