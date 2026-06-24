import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  ChevronDown,
  ChevronUp,
  X,
  PlusCircle,
  Trash2,
  Calendar,
  ClipboardList,
} from "lucide-react";
import { useAppConfirm } from "../../components/common/ConfirmDialogProvider";
import * as api from "../../api/inventory";
import type { InventoryOrder, Supplier, SparePart } from "../../types/inventory";
import { useLanguage } from "../../i18n/LanguageProvider";

export default function OrdersPage() {
  const { t, language } = useLanguage();
  const isDe = language === "de";
  const { confirm, showToast } = useAppConfirm();

  const [orders, setOrders] = useState<InventoryOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [parts, setParts] = useState<SparePart[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Expanding rows
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [orderItems, setOrderItems] = useState<{ sparePartId: string; quantity: number }[]>([
    { sparePartId: "", quantity: 5 },
  ]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ordersList, suppliersList, partsList] = await Promise.all([
        api.fetchOrders(),
        api.fetchSuppliers(),
        api.fetchSpareParts(),
      ]);
      setOrders(ordersList);
      setSuppliers(suppliersList.filter((s) => s.isActive));
      setParts(partsList.filter((p) => p.isActive));
    } catch (err: any) {
      console.error(err);
      showToast("error", err.message || "Failed to load purchase orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setSelectedSupplierId("");
    setExpectedDate("");
    setOrderItems([{ sparePartId: "", quantity: 5 }]);
    setIsModalOpen(true);
  };

  const handleAddLineItem = () => {
    setOrderItems([...orderItems, { sparePartId: "", quantity: 5 }]);
  };

  const handleRemoveLineItem = (index: number) => {
    const updated = [...orderItems];
    updated.splice(index, 1);
    setOrderItems(updated);
  };

  const handleItemFieldChange = (index: number, field: "sparePartId" | "quantity", value: any) => {
    const updated = [...orderItems];
    updated[index] = {
      ...updated[index],
      [field]: field === "quantity" ? Number(value) : value,
    };
    setOrderItems(updated);
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId) {
      showToast("error", "Please select a supplier");
      return;
    }

    const validItems = orderItems.filter((i) => i.sparePartId && i.quantity > 0);
    if (validItems.length === 0) {
      showToast("error", "Order must contain at least one part with quantity > 0");
      return;
    }

    // Check for duplicate parts in same order
    const partIds = validItems.map((i) => i.sparePartId);
    if (new Set(partIds).size !== partIds.length) {
      showToast("error", "Duplicate spare parts in order items list");
      return;
    }

    try {
      await api.createOrder({
        supplierId: selectedSupplierId,
        items: validItems,
        expectedDate: expectedDate || undefined,
      });
      showToast("success", "Purchase order placed successfully");
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      console.error(err);
      showToast("error", err.message || "Failed to create order");
    }
  };

  const handleCancelOrder = (id: string, orderNo: string) => {
    confirm({
      title: isDe ? "Bestellung stornieren?" : "Cancel Purchase Order?",
      message:
        isDe
          ? `Möchten Sie die Bestellung "${orderNo}" wirklich stornieren? Dies kann nicht rückgängig gemacht werden.`
          : `Are you sure you want to cancel purchase order "${orderNo}"? This action cannot be undone.`,
      confirmLabel: isDe ? "Ja, stornieren" : "Yes, Cancel Order",
      cancelLabel: isDe ? "Nein" : "No, Keep Order",
      variant: "danger",
      onConfirm: async () => {
        try {
          await api.cancelOrder(id);
          showToast("success", "Order cancelled successfully");
          loadData();
        } catch (err: any) {
          console.error(err);
          showToast("error", err.message || "Failed to cancel order");
        }
      },
    });
  };

  const toggleExpandRow = (orderId: string) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
    } else {
      setExpandedOrderId(orderId);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "Ordered":
        return "bg-sky-50 text-sky-700 border-sky-200";
      case "Shipped":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "PartiallyDelivered":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Delivered":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold";
      case "Cancelled":
        return "bg-red-50 text-red-600 border-red-200";
      default:
        return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  // Filter parts linked to selected supplier (optional convenience)
  const supplierParts = selectedSupplierId
    ? parts.filter((p) => p.supplierId === selectedSupplierId)
    : parts;

  // Filter orders by search and status
  const filteredOrders = orders.filter((o) => {
    const supplierName = o.supplier?.companyName || "";
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplierName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !filterStatus || o.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="card p-4 flex flex-col md:flex-row items-center gap-3 bg-white shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={
              isDe
                ? "Suchen nach Bestellnummer oder Lieferant..."
                : "Search by order # or supplier name..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input h-10 pl-10 w-full"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="input h-10 w-full md:w-48 bg-white"
        >
          <option value="">
            {isDe ? "Alle Statusse" : "All Statuses"}
          </option>
          <option value="Ordered">Ordered</option>
          <option value="Shipped">Shipped</option>
          <option value="PartiallyDelivered">Partially Delivered</option>
          <option value="Delivered">Delivered</option>
          <option value="Cancelled">Cancelled</option>
        </select>

        <button
          onClick={openAddModal}
          className="btn btn-primary h-10 px-4 text-sm font-semibold flex items-center gap-2 w-full md:w-auto shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>
            {isDe ? "Bestellung aufgeben" : "Place Purchase Order"}
          </span>
        </button>
      </div>

      {/* Orders Table */}
      <div className="card overflow-hidden bg-white shadow-sm">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-primary" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <ClipboardList className="h-12 w-12 text-slate-300 mb-3" />
            <p className="font-semibold text-lg">
              {isDe ? "Keine Bestellungen gefunden" : "No Orders Found"}
            </p>
            <p className="text-sm">
              {isDe ? "Legen Sie Ihre erste Lieferantenbestellung an." : "Compile a replenishment order to restock parts."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <th className="px-6 py-4 w-10"></th>
                  <th className="px-6 py-4">
                    {isDe ? "Bestellnummer" : "Order Number"}
                  </th>
                  <th className="px-6 py-4">
                    {isDe ? "Lieferant" : "Supplier"}
                  </th>
                  <th className="px-6 py-4">
                    {isDe ? "Bestelldatum" : "Order Date"}
                  </th>
                  <th className="px-6 py-4">
                    {isDe ? "Liefertermin (Soll)" : "Expected Delivery"}
                  </th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">
                    {isDe ? "Aktionen" : "Actions"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((o) => {
                  const isExpanded = expandedOrderId === o.id;
                  const itemQuantityTotal =
                    o.items?.reduce((sum, item) => sum + item.quantityOrdered, 0) || 0;
                  const isCancelable = ["Ordered", "Shipped", "PartiallyDelivered"].includes(o.status);

                  return (
                    <tr
                      key={o.id}
                      className={`hover:bg-slate-50/20 transition-colors ${
                        isExpanded ? "bg-slate-50/50" : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleExpandRow(o.id)}
                          className="p-1 rounded hover:bg-slate-200 text-slate-500"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-mono font-black text-slate-900">{o.orderNumber}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {o.items?.length || 0} {isDe ? "Positionen" : "Items"}{" "}
                          ({itemQuantityTotal} Units)
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800">
                        {o.supplier?.companyName || <span className="text-slate-400 italic">Auto Replenish</span>}
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium">
                        {new Date(o.orderDate || o.createdAt).toLocaleDateString("de-DE")}
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium">
                        {o.expectedDate ? (
                          <div className="flex items-center gap-1.5 text-xs text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full w-max font-semibold">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(o.expectedDate).toLocaleDateString("de-DE")}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadgeClass(
                            o.status
                          )}`}
                        >
                          {o.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isCancelable && (
                          <button
                            onClick={() => handleCancelOrder(o.id, o.orderNumber)}
                            className="btn btn-outline border-red-100 text-red-600 h-8 px-3 text-xs font-semibold hover:bg-red-50"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Expanded Row Panel (Items detail) */}
      {expandedOrderId && (
        <div className="card p-5 bg-slate-50/70 border border-slate-200 mt-2 space-y-3">
          <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
            Order Items & Deliveries Details
          </h4>
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-3">SKU / Part Name</th>
                  <th className="px-4 py-3 text-center">Ordered</th>
                  <th className="px-4 py-3 text-center">Received</th>
                  <th className="px-4 py-3 text-center">Pending</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders
                  .find((o) => o.id === expandedOrderId)
                  ?.items?.map((item) => {
                    const pendingQty = item.quantityOrdered - item.quantityReceived;
                    return (
                      <tr key={item.id}>
                        <td className="px-4 py-3">
                          <div className="font-mono text-[10px] text-slate-400 font-bold">
                            {item.sparePart?.itemNumber}
                          </div>
                          <div className="font-bold text-slate-700">{item.sparePart?.name}</div>
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-slate-800">
                          {item.quantityOrdered}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`font-semibold ${
                              item.quantityReceived > 0 ? "text-emerald-600" : "text-slate-400"
                            }`}
                          >
                            {item.quantityReceived}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center font-bold">
                          {pendingQty > 0 ? (
                            <span className="text-amber-600">{pendingQty}</span>
                          ) : (
                            <span className="text-emerald-700 bg-emerald-50 border border-emerald-100 rounded px-1.5 py-0.2 font-black">
                              FULFILLED
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Place Order Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="card w-full max-w-2xl shadow-2xl relative bg-white border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-150 px-5 py-4 bg-slate-50 rounded-t-xl">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                {isDe
                  ? "Lieferantenbestellung aufgeben"
                  : "Draft Purchase Order"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label font-semibold text-slate-700">
                    {isDe ? "Lieferant auswählen" : "Select Supplier"}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="input mt-1.5 h-11 text-sm bg-white"
                    required
                  >
                    <option value="">-- Select Supplier --</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.companyName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label font-semibold text-slate-700">
                    {isDe ? "Soll-Lieferdatum" : "Expected Delivery Date"}
                  </label>
                  <input
                    type="date"
                    className="input mt-1.5 h-11 text-sm"
                    value={expectedDate}
                    onChange={(e) => setExpectedDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="label font-bold text-slate-800 uppercase tracking-wide text-xs">
                    {isDe ? "Bestellpositionen" : "Order Items"}
                  </label>
                  <button
                    type="button"
                    onClick={handleAddLineItem}
                    className="text-xs font-semibold text-primary flex items-center gap-1 hover:underline"
                  >
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {orderItems.map((item, index) => (
                    <div key={index} className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <div className="flex-1">
                        <select
                          value={item.sparePartId}
                          onChange={(e) =>
                            handleItemFieldChange(index, "sparePartId", e.target.value)
                          }
                          className="input h-10 text-xs bg-white w-full"
                          required
                        >
                          <option value="">-- Choose Spare Part --</option>
                          {supplierParts.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.itemNumber}) - Stock: {p.stock}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-24">
                        <input
                          type="number"
                          min="1"
                          placeholder="Qty"
                          className="input h-10 text-xs font-bold text-center"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemFieldChange(index, "quantity", e.target.value)
                          }
                          required
                        />
                      </div>

                      {orderItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveLineItem(index)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded transition shrink-0"
                          title="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-outline border-slate-200 text-slate-600 h-10 px-4 text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary h-10 px-4 text-sm font-semibold"
                  disabled={orderItems.filter((i) => i.sparePartId).length === 0}
                >
                  Place Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
