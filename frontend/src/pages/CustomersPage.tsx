import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Search,
  Plus,
  Mail,
  Phone,
  Eye,
  Edit,
  Trash2,
  GitMerge,
  Download,
  FileText,
  ChevronLeft,
  ChevronRight,
  Building,
} from "lucide-react";
import { useLanguage } from "../i18n/LanguageProvider";
import { useAppConfirm } from "../components/common/ConfirmDialogProvider";
import { fetchCustomersList, deleteCustomer, exportCustomers } from "../api/customers";
import type { Customer } from "../types/customer";
import { getFriendlyErrorMessage, logApiError } from "../utils/apiErrors";
import { CustomerFormModal } from "../components/customers/CustomerFormModal";
import { CustomerMergeModal } from "../components/customers/CustomerMergeModal";

const localizations = {
  de: {
    title: "Kundenverwaltung",
    description: "Zentrale Verwaltung aller Kunden und deren vollständige Historie.",
    searchPlaceholder: "Suchen nach Kundennummer, Name, E-Mail, Telefon...",
    createBtn: "Kunde anlegen",
    mergeBtn: "Zusammenführen",
    exportBtn: "CSV-Export",
    pdfExportBtn: "PDF-Export",
    tableId: "Kunden-Nr.",
    tableName: "Kunde",
    tableCompany: "Firma",
    tableContact: "Kontakt",
    tableDate: "Erstellt am",
    tableActions: "Aktionen",
    noCustomers: "Keine Kunden gefunden.",
    editTooltip: "Kunde bearbeiten",
    deleteTooltip: "Kunde löschen",
    viewTooltip: "Details anzeigen",
    deleteConfirmTitle: "Kunde löschen?",
    deleteConfirmMessage: "Sind Sie sicher, dass Sie den Kunden {name} dauerhaft löschen möchten? Alle Transaktionsverknüpfungen werden gelöst.",
    deleting: "Wird gelöscht...",
  },
  en: {
    title: "Customer Management",
    description: "Centralized customer profiles and their complete transaction histories.",
    searchPlaceholder: "Search by customer number, name, email, phone...",
    createBtn: "Create Customer",
    mergeBtn: "Merge Duplicates",
    exportBtn: "Export CSV",
    pdfExportBtn: "Export PDF",
    tableId: "Cust-ID",
    tableName: "Customer",
    tableCompany: "Company",
    tableContact: "Contact",
    tableDate: "Date Added",
    tableActions: "Actions",
    noCustomers: "No customers found.",
    editTooltip: "Edit customer",
    deleteTooltip: "Delete customer",
    viewTooltip: "View details",
    deleteConfirmTitle: "Delete customer?",
    deleteConfirmMessage: "Are you sure you want to permanently delete the customer {name}? All transaction links will be unlinked.",
    deleting: "Deleting...",
  }
};

export function CustomersPage() {
  const { t } = useLanguage();
  const { confirm, showToast } = useAppConfirm();
  const isDe = t.pages.settings === "Einstellungen";
  const loc = isDe ? localizations.de : localizations.en;

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [isMergeOpen, setIsMergeOpen] = useState(false);

  const limit = 15;

  const loadCustomers = async (page: number, query: string) => {
    setLoading(true);
    try {
      const response = await fetchCustomersList(page, limit, query);
      setCustomers(response.customers);
      setTotalPages(response.pagination.totalPages || 1);
      setCurrentPage(response.pagination.page || 1);
    } catch (err) {
      logApiError("load customers list", err);
      showToast("error", getFriendlyErrorMessage(err, "load", t));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers(currentPage, searchQuery);
  }, [currentPage, searchQuery]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleDelete = (customer: Customer) => {
    confirm({
      title: loc.deleteConfirmTitle,
      message: loc.deleteConfirmMessage.replace("{name}", customer.name),
      confirmLabel: isDe ? "Löschen" : "Delete",
      cancelLabel: isDe ? "Abbrechen" : "Cancel",
      variant: "danger",
      onConfirm: async () => {
        try {
          await deleteCustomer(customer.id);
          showToast("success", isDe ? "Kunde gelöscht." : "Customer deleted.");
          loadCustomers(currentPage, searchQuery);
        } catch (err) {
          logApiError("delete customer", err);
          showToast("error", getFriendlyErrorMessage(err, "generic", t));
        }
      },
    });
  };

  const handleExport = async () => {
    try {
      const blob = await exportCustomers("csv");
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `customers_export_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast("success", isDe ? "CSV erfolgreich exportiert." : "CSV exported successfully.");
    } catch (err) {
      logApiError("export customers", err);
      showToast("error", isDe ? "Export fehlgeschlagen." : "Failed to export customer list.");
    }
  };

  const handleExportPdf = async () => {
    try {
      const blob = await exportCustomers("pdf");
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `customers_export_${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast("success", isDe ? "PDF erfolgreich exportiert." : "PDF exported successfully.");
    } catch (err) {
      logApiError("export customers pdf", err);
      showToast("error", isDe ? "PDF-Export fehlgeschlagen." : "Failed to export PDF.");
    }
  };

  const openCreateModal = () => {
    setEditingCustomerId(null);
    setIsFormOpen(true);
  };

  const openEditModal = (id: string) => {
    setEditingCustomerId(id);
    setIsFormOpen(true);
  };

  const handleModalSave = () => {
    setIsFormOpen(false);
    loadCustomers(currentPage, searchQuery);
  };

  const handleMergeCompleted = () => {
    setIsMergeOpen(false);
    loadCustomers(currentPage, searchQuery);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(isDe ? "de-DE" : "en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">{loc.title}</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-600">{loc.description}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={openCreateModal}
            className="btn btn-primary h-11 px-4 text-sm font-semibold"
          >
            <Plus className="h-4 w-4" />
            {loc.createBtn}
          </button>
          <button
            type="button"
            onClick={() => setIsMergeOpen(true)}
            className="btn btn-outline h-11 px-4 text-sm font-semibold border-slate-200 hover:bg-slate-50"
          >
            <GitMerge className="h-4 w-4" />
            {loc.mergeBtn}
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="btn btn-outline h-11 px-4 text-sm font-semibold border-slate-200 hover:bg-slate-50"
          >
            <Download className="h-4 w-4" />
            {loc.exportBtn}
          </button>
          <button
            type="button"
            onClick={handleExportPdf}
            className="btn btn-outline h-11 px-4 text-sm font-semibold border-slate-200 hover:bg-slate-50"
          >
            <FileText className="h-4 w-4" />
            {loc.pdfExportBtn}
          </button>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          className="input pl-10 h-11"
          placeholder={loc.searchPlaceholder}
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>

      {/* List Card */}
      <div className="card overflow-hidden">
        {loading && customers.length === 0 ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-primary" />
          </div>
        ) : customers.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-2 text-slate-500">
            <Users className="h-8 w-8 text-slate-300" />
            <span className="text-sm font-medium">{loc.noCustomers}</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4">{loc.tableId}</th>
                  <th className="px-6 py-4">{loc.tableName}</th>
                  <th className="px-6 py-4">{loc.tableCompany}</th>
                  <th className="px-6 py-4">{loc.tableContact}</th>
                  <th className="px-6 py-4">{loc.tableDate}</th>
                  <th className="px-6 py-4 text-right">{loc.tableActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4 font-mono text-xs text-slate-500 whitespace-nowrap">
                      {c.customerNumber || "N/A"}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">
                      {c.name}
                    </td>
                    <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                      {c.company ? (
                        <div className="flex items-center gap-1.5">
                          <Building className="h-4 w-4 text-slate-400" />
                          <span>{c.company}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      <div className="space-y-0.5 text-xs">
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3 shrink-0 text-slate-400" />
                          <span>{c.phone}</span>
                        </div>
                        {c.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3 shrink-0 text-slate-400" />
                            <span className="truncate max-w-[150px]">{c.email}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                      {formatDate(c.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/customers/${c.id}`}
                          className="inline-flex items-center justify-center rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
                          title={loc.viewTooltip}
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => openEditModal(c.id)}
                          className="inline-flex items-center justify-center rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
                          title={loc.editTooltip}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(c)}
                          className="inline-flex items-center justify-center rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 transition"
                          title={loc.deleteTooltip}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 bg-white px-6 py-4">
            <div className="text-xs text-slate-500 font-medium">
              {isDe ? "Seite" : "Page"} {currentPage} {isDe ? "von" : "of"} {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage <= 1 || loading}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                className="btn btn-outline h-9 px-3 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                disabled={currentPage >= totalPages || loading}
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                className="btn btn-outline h-9 px-3 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Form Dialog Modal */}
      <CustomerFormModal
        isOpen={isFormOpen}
        customerId={editingCustomerId}
        onClose={() => setIsFormOpen(false)}
        onSave={handleModalSave}
      />

      {/* Merge Dialog Modal */}
      <CustomerMergeModal
        isOpen={isMergeOpen}
        onClose={() => setIsMergeOpen(false)}
        onMerge={handleMergeCompleted}
      />
    </div>
  );
}
