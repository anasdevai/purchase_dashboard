import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  Sliders,
  FolderOpen,
  DollarSign,
  Layers,
  MapPin,
  X,
} from "lucide-react";
import { useAppConfirm } from "../../components/common/ConfirmDialogProvider";
import * as api from "../../api/inventory";
import type { SparePart, Supplier } from "../../types/inventory";
import { useLanguage } from "../../i18n/LanguageProvider";

const SPARE_PART_CATEGORIES = [
  "Display",
  "Battery",
  "LogicBoard",
  "Camera",
  "ChargingPort",
  "Keyboard",
  "Cable",
  "Other",
];

export default function SparePartsPage() {
  const { t, language } = useLanguage();
  const isDe = language === "de";
  const { confirm, showToast } = useAppConfirm();

  const [parts, setParts] = useState<SparePart[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterLowStock, setFilterLowStock] = useState(false);

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adjustingPart, setAdjustingPart] = useState<SparePart | null>(null);

  // Form Fields - Part
  const [itemNumber, setItemNumber] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Display");
  const [compatibility, setCompatibility] = useState("");
  const [stock, setStock] = useState<number>(0);
  const [minimumStock, setMinimumStock] = useState<number>(5);
  const [supplierId, setSupplierId] = useState("");
  const [purchasePrice, setPurchasePrice] = useState<number | "">("");
  const [salePrice, setSalePrice] = useState<number | "">("");
  const [storageLocation, setStorageLocation] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Form Fields - Adjust Stock
  const [qtyDiff, setQtyDiff] = useState<number | "">("");
  const [adjustReason, setAdjustReason] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [partsList, suppliersList] = await Promise.all([
        api.fetchSpareParts(),
        api.fetchSuppliers(),
      ]);
      setParts(partsList);
      setSuppliers(suppliersList.filter((s) => s.isActive));
    } catch (err: any) {
      console.error(err);
      showToast("error", err.message || "Failed to load spare parts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setItemNumber("");
    setName("");
    setCategory("Display");
    setCompatibility("");
    setStock(0);
    setMinimumStock(5);
    setSupplierId("");
    setPurchasePrice("");
    setSalePrice("");
    setStorageLocation("");
    setIsActive(true);
    setIsEditModalOpen(true);
  };

  const openEditModal = (p: SparePart) => {
    setEditingId(p.id);
    setItemNumber(p.itemNumber);
    setName(p.name);
    setCategory(p.category);
    setCompatibility(p.compatibility || "");
    setStock(p.stock);
    setMinimumStock(p.minimumStock);
    setSupplierId(p.supplierId || "");
    setPurchasePrice(p.purchasePrice);
    setSalePrice(p.salePrice);
    setStorageLocation(p.storageLocation || "");
    setIsActive(p.isActive);
    setIsEditModalOpen(true);
  };

  const openAdjustModal = (p: SparePart) => {
    setAdjustingPart(p);
    setQtyDiff("");
    setAdjustReason("");
    setIsAdjustModalOpen(true);
  };

  const handleSavePart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !itemNumber.trim() ||
      !name.trim() ||
      !compatibility.trim() ||
      !supplierId ||
      purchasePrice === "" ||
      salePrice === ""
    ) {
      showToast("error", "Please fill in all required fields (Item Number, Category, Name, Compatibility, Supplier, Purchase Price, Sale Price)");
      return;
    }

    const payload = {
      itemNumber: itemNumber.trim(),
      name: name.trim(),
      category,
      compatibility: compatibility.trim(),
      stock: Number(stock),
      minimumStock: Number(minimumStock),
      supplierId: supplierId,
      purchasePrice: Number(purchasePrice),
      salePrice: Number(salePrice),
      storageLocation: storageLocation.trim() || null,
      isActive,
    };

    try {
      if (editingId) {
        await api.updateSparePart(editingId, payload);
        showToast("success", "Spare part updated successfully");
      } else {
        await api.createSparePart(payload);
        showToast("success", "Spare part created successfully");
      }
      setIsEditModalOpen(false);
      loadData();
    } catch (err: any) {
      console.error(err);
      showToast("error", err.message || "Error occurred while saving");
    }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingPart || qtyDiff === "" || qtyDiff === 0 || !adjustReason.trim()) {
      showToast("error", "Quantity difference and reason are required");
      return;
    }

    try {
      await api.adjustStock(adjustingPart.id, {
        quantityDiff: Number(qtyDiff),
        reason: adjustReason.trim(),
      });
      showToast("success", "Stock adjusted successfully");
      setIsAdjustModalOpen(false);
      loadData();
    } catch (err: any) {
      console.error(err);
      showToast("error", err.message || "Failed to adjust stock");
    }
  };

  const handleDeletePart = (id: string, name: string) => {
    confirm({
      title: isDe ? "Teil löschen?" : "Delete Spare Part?",
      message:
        isDe
          ? `Möchten Sie das Ersatzteil "${name}" wirklich unwiderruflich löschen?`
          : `Are you sure you want to permanently delete spare part "${name}"?`,
      confirmLabel: isDe ? "Löschen" : "Delete",
      cancelLabel: isDe ? "Abbrechen" : "Cancel",
      variant: "danger",
      onConfirm: async () => {
        try {
          await api.deleteSparePart(id);
          showToast("success", "Spare part deleted successfully");
          loadData();
        } catch (err: any) {
          console.error(err);
          showToast("error", err.message || "Failed to delete spare part");
        }
      },
    });
  };

  // Metrics
  const totalItems = parts.length;
  const lowStockItems = parts.filter((p) => p.stock < p.minimumStock);
  const totalValue = parts.reduce((sum, p) => sum + p.stock * Number(p.purchasePrice), 0);

  // Filtering
  const filteredParts = parts
    .filter(
      (p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.itemNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.compatibility || "").toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter((p) => !filterCategory || p.category === filterCategory)
    .filter((p) => !filterLowStock || p.stock < p.minimumStock);

  return (
    <div className="space-y-6">
      {/* Overview Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Spare Parts Card */}
        <div className="card p-5 bg-white border border-slate-100 shadow-sm rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {isDe ? "Ersatzteile Gesamt" : "Total Spare Parts"}
            </p>
            <p className="text-2xl font-black text-slate-800 mt-1">{totalItems}</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center font-bold">
            <Layers className="h-6 w-6" />
          </div>
        </div>

        {/* Total Stock Value Card */}
        <div className="card p-5 bg-white border border-slate-100 shadow-sm rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {isDe ? "Gesamtwert (Netto)" : "Total Stock Value (Net)"}
            </p>
            <p className="text-2xl font-black text-slate-800 mt-1">
              {totalValue.toLocaleString("de-DE", { style: "currency", currency: "EUR" })}
            </p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <DollarSign className="h-6 w-6" />
          </div>
        </div>

        {/* Low Stock Alert Card */}
        <div className="card p-5 bg-white border border-slate-100 shadow-sm rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {isDe ? "Niedriger Bestand" : "Low Stock Alerts"}
            </p>
            <p className="text-2xl font-black text-red-600 mt-1">{lowStockItems.length}</p>
          </div>
          <div
            className={`h-12 w-12 rounded-xl flex items-center justify-center font-bold ${
              lowStockItems.length > 0
                ? "bg-red-50 text-red-600 animate-pulse"
                : "bg-slate-100 text-slate-400"
            }`}
          >
            <AlertTriangle className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Filter and search bar */}
      <div className="card p-4 flex flex-col md:flex-row items-center gap-3 bg-white shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={
              isDe
                ? "Suchen nach Ersatzteil..."
                : "Search parts by name, SKU, compatibility..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input h-10 pl-10 w-full"
          />
        </div>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="input h-10 w-full md:w-48 bg-white"
        >
          <option value="">
            {isDe ? "Alle Kategorien" : "All Categories"}
          </option>
          {SPARE_PART_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <button
          onClick={() => setFilterLowStock(!filterLowStock)}
          className={`btn h-10 px-4 text-sm font-semibold flex items-center gap-2 border w-full md:w-auto ${
            filterLowStock
              ? "bg-red-50 border-red-200 text-red-700"
              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
          }`}
        >
          <AlertTriangle className="h-4 w-4" />
          <span>
            {isDe ? "Nur Warnungen" : "Low Stock Only"}
          </span>
        </button>

        <button
          onClick={openAddModal}
          className="btn btn-primary h-10 px-4 text-sm font-semibold flex items-center gap-2 w-full md:w-auto shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>{isDe ? "Teil anlegen" : "Add Part"}</span>
        </button>
      </div>

      {/* Main Table Grid */}
      <div className="card overflow-hidden bg-white shadow-sm">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-primary" />
          </div>
        ) : filteredParts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <FolderOpen className="h-12 w-12 text-slate-300 mb-3" />
            <p className="font-semibold text-lg">
              {isDe ? "Keine Ersatzteile gefunden" : "No Spare Parts Found"}
            </p>
            <p className="text-sm">
              {isDe ? "Legen Sie ein neues Ersatzteil an." : "Create a spare part to begin tracking."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <th className="px-6 py-4">Item SKU / Name</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">
                    {isDe ? "Kompatibilität" : "Compatibility"}
                  </th>
                  <th className="px-6 py-4">
                    {isDe ? "Bestand / Min" : "Stock / Min"}
                  </th>
                  <th className="px-6 py-4">
                    {isDe ? "Preise (Einkauf / Verkauf)" : "Prices (Purchase / Sale)"}
                  </th>
                  <th className="px-6 py-4">
                    {isDe ? "Lagerort" : "Storage Location"}
                  </th>
                  <th className="px-6 py-4 text-right">
                    {isDe ? "Aktionen" : "Actions"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredParts.map((p) => {
                  const isLow = p.stock < p.minimumStock;
                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-slate-50/50 transition ${
                        isLow ? "bg-red-50/10 hover:bg-red-50/20" : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="font-mono text-xs text-slate-400 font-bold">{p.itemNumber}</div>
                        <div className="font-bold text-slate-800">{p.name}</div>
                        {p.supplier && (
                          <div className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded inline-block font-bold mt-1 uppercase">
                            {p.supplier.companyName}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs bg-slate-100 text-slate-600 rounded px-2 py-1 font-semibold uppercase">
                          {p.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-medium text-xs max-w-[200px] truncate" title={p.compatibility || ""}>
                        {p.compatibility || <span className="text-slate-300 italic">-</span>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-extrabold ${
                              isLow ? "text-red-600 font-black text-base animate-pulse" : "text-slate-800"
                            }`}
                          >
                            {p.stock}
                          </span>
                          <span className="text-xs text-slate-400">/ {p.minimumStock} min</span>
                          {isLow && (
                            <span
                              className="text-[9px] font-black uppercase text-red-600 bg-red-100/60 px-1 py-0.2 rounded"
                              title="Stock below minimum. Replenishment triggered or required."
                            >
                              LOW
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs font-semibold text-slate-500">
                          {isDe ? "EK (Netto):" : "Net Purchase:"}{" "}
                          <span className="font-bold text-slate-700">
                            {Number(p.purchasePrice).toFixed(2)} €
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-slate-500">
                          {isDe ? "VK (Brutto):" : "Gross Sale:"}{" "}
                          <span className="font-bold text-primary">
                            {Number(p.salePrice).toFixed(2)} €
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {p.storageLocation ? (
                          <div className="flex items-center gap-1 text-xs">
                            <MapPin className="h-3 w-3 text-slate-400" />
                            <span>{p.storageLocation}</span>
                          </div>
                        ) : (
                          <span className="text-slate-300 italic">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openAdjustModal(p)}
                            className="btn btn-outline border-amber-200 text-amber-700 p-1.5 h-8 w-8 hover:bg-amber-50"
                            title={
                              isDe
                                ? "Bestand korrigieren"
                                : "Adjust Stock"
                            }
                          >
                            <Sliders className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => openEditModal(p)}
                            className="btn btn-outline border-slate-200 text-slate-600 p-1.5 h-8 w-8 hover:bg-slate-50"
                            title="Edit"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeletePart(p.id, p.name)}
                            className="btn btn-outline border-red-100 text-red-600 p-1.5 h-8 w-8 hover:bg-red-50"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CRUD Add/Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="card w-full max-w-lg shadow-2xl relative bg-white border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-150 px-5 py-4 bg-slate-50 rounded-t-xl">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                {editingId
                  ? isDe
                    ? "Ersatzteil bearbeiten"
                    : "Edit Spare Part"
                  : isDe
                  ? "Neues Ersatzteil anlegen"
                  : "Create Spare Part"}
              </h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSavePart} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label font-semibold text-slate-700">
                    SKU / Item Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="input mt-1.5 h-11 text-sm font-mono"
                    placeholder="e.g. SP-IP14-DISP"
                    value={itemNumber}
                    onChange={(e) => setItemNumber(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="label font-semibold text-slate-700">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="input mt-1.5 h-11 text-sm bg-white"
                  >
                    {SPARE_PART_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="label font-semibold text-slate-700">
                  {isDe ? "Bezeichnung" : "Part Name"} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="input mt-1.5 h-11 text-sm font-medium"
                  placeholder="e.g. iPhone 14 Display Original"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="label font-semibold text-slate-700">
                  {isDe ? "Kompatible Modelle" : "Compatible Models"} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="input mt-1.5 h-11 text-sm"
                  placeholder="e.g. iPhone 14, iPhone 14 Pro"
                  value={compatibility}
                  onChange={(e) => setCompatibility(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label font-semibold text-slate-700">
                    {isDe ? "Aktueller Bestand" : "Initial Stock"} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="input mt-1.5 h-11 text-sm"
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    disabled={editingId !== null} // To adjust stock after creation, use the Adjust Stock modal.
                    required
                  />
                  {editingId !== null && (
                    <p className="text-[10px] text-slate-400 mt-1">
                      Use adjustment button in table to change stock count.
                    </p>
                  )}
                </div>
                <div>
                  <label className="label font-semibold text-slate-700">
                    {isDe ? "Mindestbestand" : "Minimum Stock"} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="input mt-1.5 h-11 text-sm"
                    value={minimumStock}
                    onChange={(e) => setMinimumStock(Number(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label font-semibold text-slate-700">
                  {isDe ? "Standard-Lieferant" : "Default Supplier"} <span className="text-red-500">*</span>
                </label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="input mt-1.5 h-11 text-sm bg-white"
                  required
                >
                  <option value="">{isDe ? "-- Lieferant wählen --" : "-- Select Supplier --"}</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.companyName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label font-semibold text-slate-700">
                    {isDe ? "Einkaufspreis (Netto, €)" : "Purchase Price (Net, €)"} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="input mt-1.5 h-11 text-sm"
                    placeholder="e.g. 45.00"
                    value={purchasePrice}
                    onChange={(e) =>
                      setPurchasePrice(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    required
                  />
                </div>
                <div>
                  <label className="label font-semibold text-slate-700">
                    {isDe ? "Verkaufspreis (Brutto, €)" : "Sale Price (Gross, €)"} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="input mt-1.5 h-11 text-sm"
                    placeholder="e.g. 119.00"
                    value={salePrice}
                    onChange={(e) =>
                      setSalePrice(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label font-semibold text-slate-700">
                    {isDe ? "Lagerort / Regalfach" : "Storage Location"}
                  </label>
                  <input
                    type="text"
                    className="input mt-1.5 h-11 text-sm"
                    placeholder="e.g. Shelf A-3"
                    value={storageLocation}
                    onChange={(e) => setStorageLocation(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2 pt-8">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="h-4.5 w-4.5 rounded border-slate-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="isActive" className="text-sm font-semibold text-slate-700 cursor-pointer">
                    Active
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="btn btn-outline border-slate-200 text-slate-600 h-10 px-4 text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary h-10 px-4 text-sm font-semibold"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {isAdjustModalOpen && adjustingPart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="card w-full max-w-md shadow-2xl relative bg-white border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-150 px-5 py-4 bg-slate-50 rounded-t-xl">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                {isDe ? "Bestand korrigieren" : "Adjust Stock Level"}
              </h3>
              <button
                type="button"
                onClick={() => setIsAdjustModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustStock} className="p-6 space-y-4">
              <div>
                <p className="text-sm font-bold text-slate-800">{adjustingPart.name}</p>
                <p className="text-xs text-slate-500 font-mono mt-0.5">SKU: {adjustingPart.itemNumber}</p>
                <div className="flex items-center gap-4 mt-3 bg-slate-50 p-3 rounded-lg border border-slate-150">
                  <div>
                    <span className="text-xs text-slate-400 font-semibold uppercase block">Current Stock</span>
                    <span className="text-lg font-black text-slate-700">{adjustingPart.stock}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-semibold uppercase block">New Stock</span>
                    <span className="text-lg font-black text-primary">
                      {adjustingPart.stock + (qtyDiff === "" ? 0 : Number(qtyDiff))}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="label font-semibold text-slate-700">
                  {isDe
                    ? "Differenz (z.B. -2 bei Verlust, +5 bei Nachbuchung)"
                    : "Quantity Difference (e.g. -2 for damage, +5 for audit count)"}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  className="input mt-1.5 h-11 text-sm font-bold"
                  placeholder="e.g. +3 or -2"
                  value={qtyDiff}
                  onChange={(e) =>
                    setQtyDiff(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  required
                />
              </div>

              <div>
                <label className="label font-semibold text-slate-700">
                  {isDe ? "Grund für die Korrektur" : "Reason for Adjustment"}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="input mt-1.5 h-11 text-sm bg-white"
                  required
                >
                  <option value="">-- Select Reason --</option>
                  <option value="Audit Count Correction">Inventory Audit Correction</option>
                  <option value="Damage">Damaged Part / Defective</option>
                  <option value="Loss">Loss / Theft / Missing</option>
                  <option value="Manual Supplier Inflow">Manual Supplier Restock</option>
                  <option value="Staff Usage">Staff Internal Usage</option>
                  <option value="Other">Other / Manual Override</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="btn btn-outline border-slate-200 text-slate-600 h-10 px-4 text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary h-10 px-4 text-sm font-semibold"
                  disabled={qtyDiff === "" || qtyDiff === 0 || !adjustReason}
                >
                  {isDe ? "Buchen" : "Book Adjustment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
