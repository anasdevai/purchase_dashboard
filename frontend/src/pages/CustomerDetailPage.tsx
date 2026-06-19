import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  DollarSign,
  Wrench,
  FileSpreadsheet,
  History,
  Smartphone,
  Edit,
  Trash2,
} from "lucide-react";
import { useLanguage } from "../i18n/LanguageProvider";
import { useAppConfirm } from "../components/common/ConfirmDialogProvider";
import { fetchCustomerDetail, updateCustomer, deleteCustomer } from "../api/customers";
import type { Customer, CustomerHistory } from "../types/customer";
import { CustomerFormModal } from "../components/customers/CustomerFormModal";
import { getFriendlyErrorMessage, logApiError } from "../utils/apiErrors";

const localizations = {
  de: {
    backToList: "Zurück zur Liste",
    loading: "Kundenprofil wird geladen...",
    editBtn: "Kunde bearbeiten",
    deleteBtn: "Kunde löschen (GDPR)",
    customerNumber: "Kunden-Nr.",
    salutation: "Anrede",
    dob: "Geburtsdatum",
    address: "Adresse",
    phone: "Telefon",
    email: "E-Mail",
    company: "Firma",
    vatId: "USt-IdNr.",
    newsletter: "Newsletter",
    newsletterSubbed: "Abonniert",
    newsletterOptOut: "Nicht abonniert",
    dateAdded: "Registriert am",
    tabTimeline: "Chronik",
    tabDevices: "Geräte",
    tabNotes: "Notizen",
    notesTitle: "Interne Notizen",
    notesPlaceholder: "Notiz hinzufügen...",
    notesSaveBtn: "Notizen speichern",
    notesSavedSuccess: "Notizen erfolgreich aktualisiert.",
    notesSaveFailed: "Fehler beim Speichern der Notizen.",
    noTimeline: "Keine Aktivitäten in der Historie vorhanden.",
    noDevices: "Keine verknüpften Geräte gefunden.",
    typeContract: "Kaufvertrag",
    typeRepairOrder: "Reparaturauftrag",
    typeQuotation: "Angebot",
    typeInvoice: "Rechnung",
    status: "Status",
    amount: "Betrag",
    viewBtn: "Anzeigen",
    deleteConfirmTitle: "Kunden-Account löschen?",
    deleteConfirmMessage: "Sind Sie sicher, dass Sie den Kunden {name} DSGVO-konform anonymisieren/löschen möchten? Alle personenbezogenen Daten werden unwiderruflich gelöscht.",
    deletedSuccess: "Kunde erfolgreich gelöscht.",
  },
  en: {
    backToList: "Back to List",
    loading: "Loading customer profile...",
    editBtn: "Edit Customer",
    deleteBtn: "Delete Customer (GDPR)",
    customerNumber: "Customer ID",
    salutation: "Salutation",
    dob: "Date of Birth",
    address: "Address",
    phone: "Phone",
    email: "Email",
    company: "Company",
    vatId: "VAT ID",
    newsletter: "Newsletter",
    newsletterSubbed: "Subscribed",
    newsletterOptOut: "Opt-out",
    dateAdded: "Registered",
    tabTimeline: "Timeline",
    tabDevices: "Devices",
    tabNotes: "Notes",
    notesTitle: "Internal Customer Notes",
    notesPlaceholder: "Add notes...",
    notesSaveBtn: "Save Notes",
    notesSavedSuccess: "Notes successfully updated.",
    notesSaveFailed: "Failed to save notes.",
    noTimeline: "No timeline activities found.",
    noDevices: "No linked devices found.",
    typeContract: "Purchase Contract",
    typeRepairOrder: "Repair Order",
    typeQuotation: "Quotation",
    typeInvoice: "Invoice",
    status: "Status",
    amount: "Amount",
    viewBtn: "View",
    deleteConfirmTitle: "Delete customer account?",
    deleteConfirmMessage: "Are you sure you want to delete the customer {name} in compliance with GDPR? All personal identification details will be permanently wiped.",
    deletedSuccess: "Customer successfully deleted.",
  }
};

interface TimelineItem {
  id: string;
  type: "contract" | "repairOrder" | "quotation" | "invoice";
  number: string;
  date: string;
  status: string;
  amount: number;
  link: string;
}

export function CustomerDetailPage() {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const { t, formatDate, formatMoney } = useLanguage();
  const { confirm, showToast } = useAppConfirm();
  const isDe = t.pages.settings === "Einstellungen";
  const loc = isDe ? localizations.de : localizations.en;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [history, setHistory] = useState<CustomerHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"timeline" | "devices" | "notes">("timeline");
  const [notesText, setNotesText] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const loadCustomerDetails = async () => {
    if (!customerId) return;
    setLoading(true);
    try {
      const data = await fetchCustomerDetail(customerId);
      setCustomer(data.customer);
      setHistory(data.history);
      setNotesText(data.customer.notes || "");
    } catch (err) {
      logApiError("load customer details", err);
      showToast("error", getFriendlyErrorMessage(err, "load", t));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomerDetails();
  }, [customerId]);

  const handleDelete = () => {
    if (!customer) return;
    confirm({
      title: loc.deleteConfirmTitle,
      message: loc.deleteConfirmMessage.replace("{name}", customer.name),
      confirmLabel: isDe ? "Löschen" : "Delete",
      cancelLabel: isDe ? "Abbrechen" : "Cancel",
      variant: "danger",
      onConfirm: async () => {
        try {
          await deleteCustomer(customer.id);
          showToast("success", loc.deletedSuccess);
          navigate("/customers");
        } catch (err) {
          logApiError("delete customer", err);
          showToast("error", getFriendlyErrorMessage(err, "generic", t));
        }
      },
    });
  };

  const handleSaveNotes = async () => {
    if (!customer) return;
    setSavingNotes(true);
    try {
      await updateCustomer(customer.id, { notes: notesText });
      setCustomer((prev) => prev ? { ...prev, notes: notesText } : null);
      showToast("success", loc.notesSavedSuccess);
    } catch (err) {
      logApiError("save customer notes", err);
      showToast("error", loc.notesSaveFailed);
    } finally {
      setSavingNotes(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-primary" />
        <span className="ml-3 text-sm text-slate-500 font-medium">{loc.loading}</span>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="space-y-4">
        <Link to="/customers" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft className="h-4 w-4" />
          {loc.backToList}
        </Link>
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-200">
          Customer not found or access denied.
        </div>
      </div>
    );
  }

  // Aggregate Timeline Items
  const timelineItems: TimelineItem[] = [];

  if (history) {
    history.contracts.forEach((c) => {
      timelineItems.push({
        id: c.id,
        type: "contract",
        number: c.contractNumber,
        date: c.dateISO,
        status: c.status,
        amount: Number(c.price || 0),
        link: `/contracts/${c.id}`,
      });
    });

    history.repairOrders.forEach((ro) => {
      timelineItems.push({
        id: ro.id,
        type: "repairOrder",
        number: ro.repairOrderNumber,
        date: ro.createdAt,
        status: ro.status,
        amount: Number(ro.estimatedPrice || 0),
        link: `/repair-orders/${ro.id}`,
      });
    });

    history.quotations.forEach((q) => {
      const qTotal = q.items?.reduce((sum, item) => sum + Number(item.lineTotal || 0), 0) || 0;
      timelineItems.push({
        id: q.id,
        type: "quotation",
        number: q.quotationNumber,
        date: q.createdAt,
        status: q.status,
        amount: qTotal,
        link: `/quotations/${q.id}`,
      });
    });

    history.invoices.forEach((i) => {
      timelineItems.push({
        id: i.id,
        type: "invoice",
        number: i.invoiceNumber,
        date: i.invoiceDate || i.createdAt,
        status: i.paymentStatus || "Open",
        amount: Number(i.grossTotalOverride ?? i.calculatedGrossTotal ?? 0),
        link: `/invoices/${i.id}`,
      });
    });
  }

  // Sort newest first
  timelineItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Render Status Badge for Timeline Item
  const renderStatusBadge = (item: TimelineItem) => {
    let classes = "badge ";
    let statusText = item.status;

    if (item.type === "contract") {
      const s = item.status.toLowerCase();
      if (s === "completed") {
        classes += "badge-success bg-green-50 text-green-700 border-green-200";
      } else if (s === "draft") {
        classes += "badge-warning bg-amber-50 text-amber-700 border-amber-200";
      } else {
        classes += "badge-danger bg-red-50 text-red-700 border-red-200";
      }
    } else if (item.type === "repairOrder") {
      const s = item.status.toLowerCase();
      if (s === "completed" || s === "finished") {
        classes += "badge-success bg-green-50 text-green-700 border-green-200";
      } else if (["new", "received", "indiagnosis"].includes(s)) {
        classes += "badge-info bg-blue-50 text-blue-700 border-blue-200";
      } else if (["waitingforparts", "sparepartarrived", "inrepair", "readyforpickup"].includes(s)) {
        classes += "badge-warning bg-amber-50 text-amber-700 border-amber-200";
      } else {
        classes += "badge-danger bg-red-50 text-red-700 border-red-200";
      }
    } else if (item.type === "quotation") {
      const s = item.status.toLowerCase();
      if (s === "accepted") {
        classes += "badge-success bg-green-50 text-green-700 border-green-200";
      } else if (s === "sent" || s === "draft") {
        classes += "badge-info bg-blue-50 text-blue-700 border-blue-200";
      } else {
        classes += "badge-danger bg-red-50 text-red-700 border-red-200";
      }
    } else if (item.type === "invoice") {
      const s = item.status.toLowerCase();
      if (s === "paid") {
        classes += "badge-success bg-green-50 text-green-700 border-green-200";
      } else if (["open", "sent", "partiallypaid"].includes(s)) {
        classes += "badge-info bg-blue-50 text-blue-700 border-blue-200";
      } else if (s === "overdue") {
        classes += "badge-warning bg-amber-50 text-amber-700 border-amber-200";
      } else {
        classes += "badge-danger bg-red-50 text-red-700 border-red-200";
      }
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${classes}`}>
        {statusText}
      </span>
    );
  };

  const renderTimelineIcon = (type: TimelineItem["type"]) => {
    switch (type) {
      case "contract":
        return <FileText className="h-4 w-4 text-emerald-600" />;
      case "repairOrder":
        return <Wrench className="h-4 w-4 text-amber-600" />;
      case "quotation":
        return <FileSpreadsheet className="h-4 w-4 text-blue-600" />;
      case "invoice":
        return <DollarSign className="h-4 w-4 text-purple-600" />;
    }
  };

  const renderTimelineLabel = (type: TimelineItem["type"]) => {
    switch (type) {
      case "contract":
        return loc.typeContract;
      case "repairOrder":
        return loc.typeRepairOrder;
      case "quotation":
        return loc.typeQuotation;
      case "invoice":
        return loc.typeInvoice;
    }
  };

  const formatDateText = (dStr: string | null) => {
    if (!dStr) return "-";
    return formatDate(dStr);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Link to="/customers" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
            <ArrowLeft className="h-4 w-4" />
            {loc.backToList}
          </Link>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">{customer.name}</h1>
          <p className="text-xs font-mono text-slate-500">{customer.customerNumber || "N/A"}</p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setIsFormOpen(true)}
            className="btn btn-outline h-11 px-4 text-sm font-semibold border-slate-200 hover:bg-slate-50"
          >
            <Edit className="h-4 w-4" />
            {loc.editBtn}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="btn bg-red-50 text-red-600 hover:bg-red-100 h-11 px-4 text-sm font-semibold border border-red-200"
          >
            <Trash2 className="h-4 w-4" />
            {loc.deleteBtn}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Profile Card (Left) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="card overflow-hidden">
            <div className="card-header bg-slate-50/50 py-4 px-6 border-b border-slate-200">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <User className="h-4 w-4 text-slate-500" />
                {isDe ? "Profil Übersicht" : "Profile Overview"}
              </h2>
            </div>
            <div className="card-body p-6 space-y-4 text-sm">
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">{loc.customerNumber}</span>
                <span className="font-semibold text-slate-900 font-mono">{customer.customerNumber || "-"}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">{loc.salutation}</span>
                <span className="font-semibold text-slate-900">{customer.salutation || "-"}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">{loc.dob}</span>
                <span className="font-semibold text-slate-900">{formatDateText(customer.dateOfBirth)}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">{loc.company}</span>
                <span className="font-semibold text-slate-900">{customer.company || "-"}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">{loc.vatId}</span>
                <span className="font-semibold text-slate-900">{customer.vatId || "-"}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">{loc.phone}</span>
                <span className="font-semibold text-slate-900 flex items-center gap-1">
                  <Phone className="h-3 w-3 text-slate-400" />
                  {customer.phone}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">{loc.email}</span>
                <span className="font-semibold text-slate-900 flex items-center gap-1">
                  <Mail className="h-3 w-3 text-slate-400" />
                  {customer.email || "-"}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">{loc.newsletter}</span>
                <span className="font-semibold text-slate-900">
                  {customer.newsletter ? (
                    <span className="text-green-600 font-medium">{loc.newsletterSubbed}</span>
                  ) : (
                    <span className="text-slate-400 font-medium">{loc.newsletterOptOut}</span>
                  )}
                </span>
              </div>
              <div className="flex flex-col border-b border-slate-100 pb-2 gap-1">
                <span className="text-slate-500">{loc.address}</span>
                <span className="font-semibold text-slate-900 flex items-start gap-1">
                  <MapPin className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
                  <div className="text-xs">
                    <div>{customer.street || "-"}</div>
                    <div>{customer.zipCode || ""} {customer.city || ""}</div>
                  </div>
                </span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-slate-500">{loc.dateAdded}</span>
                <span className="font-semibold text-slate-900">{formatDateText(customer.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs and Tab Content (Right) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="card overflow-hidden">
            {/* Tabs Selector */}
            <div className="flex border-b border-slate-200 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setActiveTab("timeline")}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 transition ${
                  activeTab === "timeline"
                    ? "border-primary text-primary"
                    : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/50"
                }`}
              >
                <History className="h-4 w-4" />
                {loc.tabTimeline}
                {timelineItems.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 text-xs font-bold rounded-full bg-slate-100 text-slate-600">
                    {timelineItems.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("devices")}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 transition ${
                  activeTab === "devices"
                    ? "border-primary text-primary"
                    : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/50"
                }`}
              >
                <Smartphone className="h-4 w-4" />
                {loc.tabDevices}
                {history?.devices && history.devices.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 text-xs font-bold rounded-full bg-slate-100 text-slate-600">
                    {history.devices.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("notes")}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 transition ${
                  activeTab === "notes"
                    ? "border-primary text-primary"
                    : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/50"
                }`}
              >
                <FileText className="h-4 w-4" />
                {loc.tabNotes}
              </button>
            </div>

            {/* Tab Body */}
            <div className="p-6">
              {/* Timeline Tab */}
              {activeTab === "timeline" && (
                <div className="space-y-4">
                  {timelineItems.length === 0 ? (
                    <div className="flex h-32 flex-col items-center justify-center gap-2 text-slate-500">
                      <History className="h-8 w-8 text-slate-300" />
                      <span className="text-sm font-medium">{loc.noTimeline}</span>
                    </div>
                  ) : (
                    <div className="relative border-l border-slate-200 ml-4 space-y-6 py-2">
                      {timelineItems.map((item) => (
                        <div key={`${item.type}-${item.id}`} className="relative pl-8">
                          {/* Dot Icon */}
                          <div className="absolute -left-[17px] top-1.5 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm">
                            {renderTimelineIcon(item.type)}
                          </div>

                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-lg p-4 transition">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                  {renderTimelineLabel(item.type)}
                                </span>
                                <span className="font-semibold text-slate-900 font-mono text-sm">
                                  {item.number}
                                </span>
                                {renderStatusBadge(item)}
                              </div>
                              <div className="text-xs text-slate-500 font-medium">
                                {formatDateText(item.date)}
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-4">
                              <div className="text-right">
                                <div className="text-xs text-slate-500 font-medium">{loc.amount}</div>
                                <div className="text-sm font-bold text-slate-900">
                                  {formatMoney(item.amount)}
                                </div>
                              </div>
                              <Link
                                to={item.link}
                                className="btn btn-secondary h-9 px-3 text-xs font-semibold"
                              >
                                {loc.viewBtn}
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Devices Tab */}
              {activeTab === "devices" && (
                <div className="space-y-4">
                  {!history?.devices || history.devices.length === 0 ? (
                    <div className="flex h-32 flex-col items-center justify-center gap-2 text-slate-500">
                      <Smartphone className="h-8 w-8 text-slate-300" />
                      <span className="text-sm font-medium">{loc.noDevices}</span>
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-slate-200 rounded-lg">
                      <table className="w-full text-left text-sm border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                            <th className="px-4 py-3">{isDe ? "Gerät" : "Device"}</th>
                            <th className="px-4 py-3">IMEI / SN</th>
                            <th className="px-4 py-3">{isDe ? "Typ" : "Type"}</th>
                            <th className="px-4 py-3">{isDe ? "Quelle" : "Source"}</th>
                            <th className="px-4 py-3">{isDe ? "Datum" : "Date"}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {history.devices.map((device, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 transition">
                              <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                                {device.brand} {device.model}
                              </td>
                              <td className="px-4 py-3 font-mono text-xs text-slate-600 whitespace-nowrap">
                                {device.imeiOrSerial || "-"}
                              </td>
                              <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                                {device.deviceType}
                              </td>
                              <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                                {device.source}
                              </td>
                              <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                                {formatDateText(device.createdAt)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Notes Tab */}
              {activeTab === "notes" && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-900">{loc.notesTitle}</h3>
                  <textarea
                    rows={8}
                    className="input w-full p-3 text-sm focus:ring-primary focus:border-primary resize-y"
                    placeholder={loc.notesPlaceholder}
                    value={notesText}
                    onChange={(e) => setNotesText(e.target.value)}
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={savingNotes}
                      onClick={handleSaveNotes}
                      className="btn btn-primary h-10 px-4 text-sm font-semibold"
                    >
                      {savingNotes ? (isDe ? "Wird gespeichert..." : "Saving...") : loc.notesSaveBtn}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form Modal */}
      <CustomerFormModal
        isOpen={isFormOpen}
        customerId={customer.id}
        onClose={() => setIsFormOpen(false)}
        onSave={() => {
          setIsFormOpen(false);
          loadCustomerDetails();
        }}
      />
    </div>
  );
}
