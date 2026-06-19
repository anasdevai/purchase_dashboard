import { useState } from "react";
import { X, Search, GitMerge, AlertTriangle, User } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageProvider";
import { useAppConfirm } from "../common/ConfirmDialogProvider";
import { searchCustomers, mergeCustomers } from "../../api/customers";
import type { Customer } from "../../types/customer";
import { getFriendlyErrorMessage, logApiError } from "../../utils/apiErrors";

const localizations = {
  de: {
    title: "Kunden zusammenführen",
    desc: "Verschmilzt zwei Kundenkontakte. Alle Verträge, Rechnungen, Reparaturaufträge und Angebote des Duplikats werden auf das Hauptkonto übertragen. Das Duplikat wird anschließend gelöscht.",
    searchPrimaryLabel: "1. Haupt-Kunde (Behalten)",
    searchDuplicateLabel: "2. Duplikat-Kunde (Löschen)",
    searchPlaceholder: "Name, E-Mail oder Tel. suchen...",
    searchBtn: "Suchen",
    selectBtn: "Auswählen",
    selectedLabel: "Ausgewählt:",
    warningTitle: "Achtung: Dies kann nicht rückgängig gemacht werden!",
    warningDesc: "Alle Vorgänge werden übertragen. Das Duplikat-Konto wird dauerhaft entfernt.",
    mergeBtn: "Zusammenführen bestätigen",
    merging: "Wird zusammengeführt...",
    cancel: "Abbrechen",
    noResults: "Keine Kunden gefunden.",
    errSameCustomer: "Haupt-Kunde und Duplikat-Kunde dürfen nicht identisch sein.",
    errSelection: "Bitte wählen Sie beide Kunden aus.",
    success: "Kunden erfolgreich zusammengeführt.",
  },
  en: {
    title: "Merge Duplicate Customers",
    desc: "Merge two customer profiles. All contracts, invoices, repair orders, and quotations of the duplicate customer will be transferred to the primary customer. The duplicate profile will be deleted.",
    searchPrimaryLabel: "1. Primary Customer (Keep)",
    searchDuplicateLabel: "2. Duplicate Customer (Delete)",
    searchPlaceholder: "Search by name, email, or phone...",
    searchBtn: "Search",
    selectBtn: "Select",
    selectedLabel: "Selected:",
    warningTitle: "Attention: This action is irreversible!",
    warningDesc: "All transactions will be moved to the primary customer. The duplicate profile will be deleted.",
    mergeBtn: "Confirm Merge",
    merging: "Merging...",
    cancel: "Cancel",
    noResults: "No customers found.",
    errSameCustomer: "Primary and duplicate customer cannot be the same.",
    errSelection: "Please select both customers.",
    success: "Customers merged successfully.",
  }
};

export interface CustomerMergeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMerge: () => void;
}

export function CustomerMergeModal({ isOpen, onClose, onMerge }: CustomerMergeModalProps) {
  const { t } = useLanguage();
  const { showToast } = useAppConfirm();
  const isDe = t.pages.settings === "Einstellungen";
  const loc = isDe ? localizations.de : localizations.en;

  const [merging, setMerging] = useState(false);

  // Search & Selection State (Primary)
  const [primaryQuery, setPrimaryQuery] = useState("");
  const [primaryResults, setPrimaryResults] = useState<Customer[]>([]);
  const [primarySelected, setPrimarySelected] = useState<Customer | null>(null);
  const [searchingPrimary, setSearchingPrimary] = useState(false);

  // Search & Selection State (Duplicate)
  const [duplicateQuery, setDuplicateQuery] = useState("");
  const [duplicateResults, setDuplicateResults] = useState<Customer[]>([]);
  const [duplicateSelected, setDuplicateSelected] = useState<Customer | null>(null);
  const [searchingDuplicate, setSearchingDuplicate] = useState(false);

  if (!isOpen) return null;

  const handleSearchPrimary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!primaryQuery.trim()) return;
    setSearchingPrimary(true);
    try {
      const results = await searchCustomers(primaryQuery);
      setPrimaryResults(results);
    } catch (err) {
      logApiError("search primary customer", err);
      showToast("error", getFriendlyErrorMessage(err, "load", t));
    } finally {
      setSearchingPrimary(false);
    }
  };

  const handleSearchDuplicate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!duplicateQuery.trim()) return;
    setSearchingDuplicate(true);
    try {
      const results = await searchCustomers(duplicateQuery);
      setDuplicateResults(results);
    } catch (err) {
      logApiError("search duplicate customer", err);
      showToast("error", getFriendlyErrorMessage(err, "load", t));
    } finally {
      setSearchingDuplicate(false);
    }
  };

  const handleConfirmMerge = async () => {
    if (!primarySelected || !duplicateSelected) {
      showToast("error", loc.errSelection);
      return;
    }
    if (primarySelected.id === duplicateSelected.id) {
      showToast("error", loc.errSameCustomer);
      return;
    }

    setMerging(true);
    try {
      await mergeCustomers(primarySelected.id, duplicateSelected.id);
      showToast("success", loc.success);
      // Reset Modal
      setPrimaryQuery("");
      setPrimarySelected(null);
      setPrimaryResults([]);
      setDuplicateQuery("");
      setDuplicateSelected(null);
      setDuplicateResults([]);
      onMerge();
    } catch (err) {
      logApiError("merge customers submit", err);
      showToast("error", getFriendlyErrorMessage(err, "generic", t));
    } finally {
      setMerging(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full my-8 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <GitMerge className="h-5 w-5 text-primary" />
            {loc.title}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <p className="text-sm text-slate-600 leading-relaxed bg-blue-50/50 border border-blue-100 rounded-lg p-4">
            {loc.desc}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Primary Column */}
            <div className="space-y-4">
              <label className="block text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                {loc.searchPrimaryLabel}
              </label>

              {primarySelected ? (
                <div className="bg-slate-50 border border-emerald-200 rounded-lg p-4 relative">
                  <button
                    onClick={() => setPrimarySelected(null)}
                    className="absolute top-2 right-2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-emerald-100 p-2 text-emerald-700 mt-1">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="text-sm">
                      <div className="font-bold text-slate-900">{primarySelected.name}</div>
                      <div className="font-mono text-xs text-slate-500">{primarySelected.customerNumber || "N/A"}</div>
                      <div className="text-xs text-slate-600 mt-1">{primarySelected.phone}</div>
                      <div className="text-xs text-slate-600">{primarySelected.email || "-"}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <form onSubmit={handleSearchPrimary} className="flex gap-2">
                    <input
                      type="text"
                      className="input h-10 text-sm"
                      placeholder={loc.searchPlaceholder}
                      value={primaryQuery}
                      onChange={(e) => setPrimaryQuery(e.target.value)}
                    />
                    <button
                      type="submit"
                      disabled={searchingPrimary}
                      className="btn btn-secondary h-10 px-4 text-xs font-semibold"
                    >
                      {searchingPrimary ? "..." : <Search className="h-4 w-4" />}
                    </button>
                  </form>

                  {/* Primary Results */}
                  {primaryResults.length > 0 && (
                    <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-48 overflow-y-auto bg-white shadow-sm">
                      {primaryResults.map((c) => (
                        <div key={c.id} className="flex items-center justify-between p-3 hover:bg-slate-50 transition text-sm">
                          <div>
                            <div className="font-semibold text-slate-900">{c.name}</div>
                            <div className="font-mono text-xs text-slate-500">{c.customerNumber || "N/A"}</div>
                          </div>
                          <button
                            onClick={() => {
                              setPrimarySelected(c);
                              setPrimaryResults([]);
                            }}
                            className="btn btn-outline h-8 px-2 text-xs font-bold border-slate-200"
                          >
                            {loc.selectBtn}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {primaryResults.length === 0 && primaryQuery && !searchingPrimary && (
                    <p className="text-xs text-slate-400 italic">{loc.noResults}</p>
                  )}
                </div>
              )}
            </div>

            {/* Duplicate Column */}
            <div className="space-y-4">
              <label className="block text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                {loc.searchDuplicateLabel}
              </label>

              {duplicateSelected ? (
                <div className="bg-slate-50 border border-red-200 rounded-lg p-4 relative">
                  <button
                    onClick={() => setDuplicateSelected(null)}
                    className="absolute top-2 right-2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-red-100 p-2 text-red-700 mt-1">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="text-sm">
                      <div className="font-bold text-slate-900">{duplicateSelected.name}</div>
                      <div className="font-mono text-xs text-slate-500">{duplicateSelected.customerNumber || "N/A"}</div>
                      <div className="text-xs text-slate-600 mt-1">{duplicateSelected.phone}</div>
                      <div className="text-xs text-slate-600">{duplicateSelected.email || "-"}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <form onSubmit={handleSearchDuplicate} className="flex gap-2">
                    <input
                      type="text"
                      className="input h-10 text-sm"
                      placeholder={loc.searchPlaceholder}
                      value={duplicateQuery}
                      onChange={(e) => setDuplicateQuery(e.target.value)}
                    />
                    <button
                      type="submit"
                      disabled={searchingDuplicate}
                      className="btn btn-secondary h-10 px-4 text-xs font-semibold"
                    >
                      {searchingDuplicate ? "..." : <Search className="h-4 w-4" />}
                    </button>
                  </form>

                  {/* Duplicate Results */}
                  {duplicateResults.length > 0 && (
                    <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-48 overflow-y-auto bg-white shadow-sm">
                      {duplicateResults.map((c) => (
                        <div key={c.id} className="flex items-center justify-between p-3 hover:bg-slate-50 transition text-sm">
                          <div>
                            <div className="font-semibold text-slate-900">{c.name}</div>
                            <div className="font-mono text-xs text-slate-500">{c.customerNumber || "N/A"}</div>
                          </div>
                          <button
                            onClick={() => {
                              setDuplicateSelected(c);
                              setDuplicateResults([]);
                            }}
                            className="btn btn-outline h-8 px-2 text-xs font-bold border-slate-200"
                          >
                            {loc.selectBtn}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {duplicateResults.length === 0 && duplicateQuery && !searchingDuplicate && (
                    <p className="text-xs text-slate-400 italic">{loc.noResults}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action Warning Card */}
          {primarySelected && duplicateSelected && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3 text-amber-800">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm">
                <span className="font-bold block mb-1">{loc.warningTitle}</span>
                <span>{loc.warningDesc}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            disabled={merging}
            className="btn btn-outline h-11 px-5 text-sm font-semibold border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            {loc.cancel}
          </button>
          <button
            type="button"
            onClick={handleConfirmMerge}
            disabled={merging || !primarySelected || !duplicateSelected}
            className="btn btn-primary h-11 px-5 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {merging ? loc.merging : loc.mergeBtn}
          </button>
        </div>
      </div>
    </div>
  );
}
