import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Globe,
  Mail,
  Phone,
  User,
  Clock,
  CreditCard,
  X,
  Truck,
} from "lucide-react";
import { useAppConfirm } from "../../components/common/ConfirmDialogProvider";
import * as api from "../../api/inventory";
import type { Supplier } from "../../types/inventory";
import { useLanguage } from "../../i18n/LanguageProvider";

export default function SuppliersPage() {
  const { t } = useLanguage();
  const { confirm, showToast } = useAppConfirm();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [companyName, setCompanyName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [deliveryTime, setDeliveryTime] = useState<number | "">("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [isActive, setIsActive] = useState(true);

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const list = await api.fetchSuppliers();
      setSuppliers(list);
    } catch (err: any) {
      console.error(err);
      showToast("error", err.message || "Failed to load suppliers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setCompanyName("");
    setContactPerson("");
    setPhone("");
    setEmail("");
    setWebsite("");
    setDeliveryTime("");
    setPaymentTerms("");
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (s: Supplier) => {
    setEditingId(s.id);
    setCompanyName(s.companyName);
    setContactPerson(s.contactPerson || "");
    setPhone(s.phone || "");
    setEmail(s.email);
    setWebsite(s.website || "");
    setDeliveryTime(s.deliveryTime || "");
    setPaymentTerms(s.paymentTerms || "");
    setIsActive(s.isActive);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !email.trim()) {
      showToast("error", "Company Name and Email are required");
      return;
    }

    const payload = {
      companyName: companyName.trim(),
      contactPerson: contactPerson.trim() || null,
      phone: phone.trim() || null,
      email: email.trim(),
      website: website.trim() || null,
      deliveryTime: deliveryTime === "" ? null : Number(deliveryTime),
      paymentTerms: paymentTerms.trim() || null,
      isActive,
    };

    try {
      if (editingId) {
        await api.updateSupplier(editingId, payload);
        showToast("success", "Supplier updated successfully");
      } else {
        await api.createSupplier(payload);
        showToast("success", "Supplier created successfully");
      }
      setIsModalOpen(false);
      loadSuppliers();
    } catch (err: any) {
      console.error(err);
      showToast("error", err.message || "Error occurred while saving");
    }
  };

  const handleDelete = (id: string, name: string) => {
    confirm({
      title: t.pages.settings === "Einstellungen" ? "Lieferant löschen?" : "Delete Supplier?",
      message:
        t.pages.settings === "Einstellungen"
          ? `Möchten Sie den Lieferanten "${name}" wirklich löschen?`
          : `Are you sure you want to permanently delete supplier "${name}"?`,
      confirmLabel: t.pages.settings === "Einstellungen" ? "Löschen" : "Delete",
      cancelLabel: t.pages.settings === "Einstellungen" ? "Abbrechen" : "Cancel",
      variant: "danger",
      onConfirm: async () => {
        try {
          await api.deleteSupplier(id);
          showToast("success", "Supplier deleted successfully");
          loadSuppliers();
        } catch (err: any) {
          console.error(err);
          showToast("error", err.message || "Failed to delete supplier");
        }
      },
    });
  };

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.contactPerson || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Search and Add Header */}
      <div className="card p-4 flex flex-col sm:flex-row items-center gap-3 justify-between bg-white shadow-sm">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={
              t.pages.settings === "Einstellungen"
                ? "Suchen nach Lieferant..."
                : "Search suppliers by company or contact..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input h-10 pl-10 w-full"
          />
        </div>
        <button
          onClick={openAddModal}
          className="btn btn-primary h-10 px-4 text-sm font-semibold flex items-center gap-2 w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          <span>
            {t.pages.settings === "Einstellungen" ? "Lieferant hinzufügen" : "Add Supplier"}
          </span>
        </button>
      </div>

      {/* Grid List */}
      <div className="card overflow-hidden bg-white shadow-sm">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-primary" />
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <Truck className="h-12 w-12 text-slate-300 mb-3" />
            <p className="font-semibold text-lg">
              {t.pages.settings === "Einstellungen" ? "Keine Lieferanten gefunden" : "No Suppliers Found"}
            </p>
            <p className="text-sm">
              {t.pages.settings === "Einstellungen" ? "Fügen Sie einen neuen Lieferanten hinzu." : "Add a supplier to get started."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <th className="px-6 py-4">
                    {t.pages.settings === "Einstellungen" ? "Firma / Kontakt" : "Company / Contact"}
                  </th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">
                    {t.pages.settings === "Einstellungen" ? "Telefon" : "Phone"}
                  </th>
                  <th className="px-6 py-4">
                    {t.pages.settings === "Einstellungen" ? "Lieferzeit / Konditionen" : "Delivery / Terms"}
                  </th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">
                    {t.pages.settings === "Einstellungen" ? "Aktionen" : "Actions"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSuppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{s.companyName}</div>
                      {s.contactPerson && (
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <User className="h-3 w-3 shrink-0" />
                          <span>{s.contactPerson}</span>
                        </div>
                      )}
                      {s.website && (
                        <a
                          href={s.website.startsWith("http") ? s.website : `https://${s.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-sky-600 hover:underline flex items-center gap-1 mt-0.5"
                        >
                          <Globe className="h-3 w-3 shrink-0" />
                          <span>{s.website}</span>
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        <a href={`mailto:${s.email}`} className="hover:underline">
                          {s.email}
                        </a>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {s.phone ? (
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-slate-400" />
                          <a href={`tel:${s.phone}`} className="hover:underline">
                            {s.phone}
                          </a>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <div className="space-y-1">
                        {s.deliveryTime && (
                          <div className="text-xs flex items-center gap-1">
                            <Clock className="h-3 w-3 text-slate-400 shrink-0" />
                            <span>{s.deliveryTime} {t.pages.settings === "Einstellungen" ? "Tage" : "days"}</span>
                          </div>
                        )}
                        {s.paymentTerms && (
                          <div className="text-xs flex items-center gap-1">
                            <CreditCard className="h-3 w-3 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[150px]" title={s.paymentTerms}>
                              {s.paymentTerms}
                            </span>
                          </div>
                        )}
                        {!s.deliveryTime && !s.paymentTerms && <span className="text-slate-400 italic">-</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                          s.isActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-50 text-slate-600 border-slate-200"
                        }`}
                      >
                        {s.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(s)}
                          className="btn btn-outline border-slate-200 text-slate-600 p-1.5 h-8 w-8 hover:bg-slate-50"
                          title="Edit"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(s.id, s.companyName)}
                          className="btn btn-outline border-red-100 text-red-600 p-1.5 h-8 w-8 hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CRUD Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="card w-full max-w-lg shadow-2xl relative bg-white border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-150 px-5 py-4 bg-slate-50 rounded-t-xl">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                {editingId
                  ? t.pages.settings === "Einstellungen"
                    ? "Lieferant bearbeiten"
                    : "Edit Supplier"
                  : t.pages.settings === "Einstellungen"
                  ? "Lieferant hinzufügen"
                  : "Add Supplier"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="label font-semibold text-slate-700">
                  {t.pages.settings === "Einstellungen" ? "Firmenname" : "Company Name"} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="input mt-1.5 h-11 text-sm font-medium"
                  placeholder="e.g. Sclera Parts GmbH"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label font-semibold text-slate-700">
                    {t.pages.settings === "Einstellungen" ? "Ansprechpartner" : "Contact Person"}
                  </label>
                  <input
                    type="text"
                    className="input mt-1.5 h-11 text-sm"
                    placeholder="e.g. John Doe"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label font-semibold text-slate-700">
                    {t.pages.settings === "Einstellungen" ? "Telefonnummer" : "Phone Number"}
                  </label>
                  <input
                    type="tel"
                    className="input mt-1.5 h-11 text-sm"
                    placeholder="e.g. +49 123 45678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="label font-semibold text-slate-700">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  className="input mt-1.5 h-11 text-sm"
                  placeholder="e.g. contact@supplier.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="label font-semibold text-slate-700">Webseite</label>
                <input
                  type="text"
                  className="input mt-1.5 h-11 text-sm"
                  placeholder="e.g. www.supplier.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label font-semibold text-slate-700">
                    {t.pages.settings === "Einstellungen" ? "Lieferzeit (Tage)" : "Delivery Time (Days)"}
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="input mt-1.5 h-11 text-sm"
                    placeholder="e.g. 5"
                    value={deliveryTime}
                    onChange={(e) =>
                      setDeliveryTime(e.target.value === "" ? "" : Number(e.target.value))
                    }
                  />
                </div>
                <div>
                  <label className="label font-semibold text-slate-700">
                    {t.pages.settings === "Einstellungen" ? "Zahlungskonditionen" : "Payment Terms"}
                  </label>
                  <input
                    type="text"
                    className="input mt-1.5 h-11 text-sm"
                    placeholder="e.g. Net 30"
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4.5 w-4.5 rounded border-slate-300 text-primary focus:ring-primary"
                />
                <label htmlFor="isActive" className="text-sm font-semibold text-slate-700 cursor-pointer">
                  {t.pages.settings === "Einstellungen"
                    ? "Lieferant aktiv (wird in Auswahllisten angezeigt)"
                    : "Active (visible in selection dropdowns)"}
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-outline border-slate-200 text-slate-600 h-10 px-4 text-sm font-semibold"
                >
                  {t.pages.settings === "Einstellungen" ? "Abbrechen" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary h-10 px-4 text-sm font-semibold"
                >
                  {t.pages.settings === "Einstellungen" ? "Speichern" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
