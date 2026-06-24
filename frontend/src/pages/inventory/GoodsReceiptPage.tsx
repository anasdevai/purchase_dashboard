import { useEffect, useState } from "react";
import {
  Download,
  Search,
  CheckCircle,
  AlertTriangle,
  History,
  X,
  FileText,
  User,
  PlusSquare,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useAppConfirm } from "../../components/common/ConfirmDialogProvider";
import * as api from "../../api/inventory";
import type { InventoryOrder, GoodsReceipt, BookReceiptResult } from "../../types/inventory";
import { useLanguage } from "../../i18n/LanguageProvider";

type SubTab = "book" | "history";

export default function GoodsReceiptPage() {
  const { language } = useLanguage();
  const isDe = language === "de";
  const { confirm, showToast } = useAppConfirm();

  const [activeSubTab, setActiveSubTab] = useState<SubTab>("book");
  const [pendingOrders, setPendingOrders] = useState<InventoryOrder[]>([]);
  const [receipts, setReceipts] = useState<GoodsReceipt[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Booking Form State
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<InventoryOrder | null>(null);
  const [receivedQtys, setReceivedQtys] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState("");

  // Reconciliation Result Modal
  const [reconcileResult, setReconcileResult] = useState<BookReceiptResult | null>(null);

  // Expanding historic rows
  const [expandedReceiptId, setExpandedReceiptId] = useState<string | null>(null);

  const loadPendingOrders = async () => {
    setLoading(true);
    try {
      const allOrders = await api.fetchOrders();
      // Only keep orders that are eligible for booking receipts
      const pending = allOrders.filter(
        (o) => o.status === "Ordered" || o.status === "Shipped" || o.status === "PartiallyDelivered"
      );
      setPendingOrders(pending);
    } catch (err: any) {
      console.error(err);
      showToast("error", err.message || "Failed to load pending orders");
    } finally {
      setLoading(false);
    }
  };

  const loadReceipts = async () => {
    setLoading(true);
    try {
      const list = await api.fetchReceipts();
      setReceipts(list);
    } catch (err: any) {
      console.error(err);
      showToast("error", err.message || "Failed to load receipt history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === "book") {
      loadPendingOrders();
      setSelectedOrderId("");
      setSelectedOrder(null);
      setReceivedQtys({});
      setNotes("");
    } else {
      loadReceipts();
    }
  }, [activeSubTab]);

  const handleOrderSelectionChange = async (orderId: string) => {
    setSelectedOrderId(orderId);
    if (!orderId) {
      setSelectedOrder(null);
      setReceivedQtys({});
      return;
    }

    setLoading(true);
    try {
      const order = await api.fetchOrderDetail(orderId);
      setSelectedOrder(order);

      // Auto-populate with remaining quantities
      const initialQtys: Record<string, number> = {};
      order.items?.forEach((item) => {
        const remaining = item.quantityOrdered - item.quantityReceived;
        initialQtys[item.sparePartId] = remaining > 0 ? remaining : 0;
      });
      setReceivedQtys(initialQtys);
    } catch (err: any) {
      console.error(err);
      showToast("error", "Failed to retrieve order details");
    } finally {
      setLoading(false);
    }
  };

  const handleQtyChange = (partId: string, val: number) => {
    setReceivedQtys({
      ...receivedQtys,
      [partId]: val < 0 ? 0 : val,
    });
  };

  const handleBookReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId || !selectedOrder) return;

    // Compile items to book
    const itemsToBook = Object.entries(receivedQtys)
      .map(([sparePartId, quantityReceived]) => ({
        sparePartId,
        quantityReceived,
      }))
      .filter((i) => i.quantityReceived > 0);

    if (itemsToBook.length === 0) {
      showToast("error", "Please record a quantity of at least 1 for one of the items.");
      return;
    }

    confirm({
      title: isDe ? "Wareneingang buchen?" : "Confirm Goods Receipt?",
      message:
        isDe
          ? "Der Bestand der Teile wird erhöht und die Bestellung aktualisiert."
          : "This will increment the stock of selected parts and reconcile the purchase order status.",
      confirmLabel: isDe ? "Buchen" : "Book Receipt",
      cancelLabel: isDe ? "Abbrechen" : "Cancel",
      variant: "primary",
      onConfirm: async () => {
        try {
          const res = await api.createReceipt({
            orderId: selectedOrderId,
            items: itemsToBook,
            notes: notes.trim() || undefined,
          });

          setReconcileResult(res);
          showToast("success", "Goods receipt booked successfully!");

          // Reset forms
          setSelectedOrderId("");
          setSelectedOrder(null);
          setReceivedQtys({});
          setNotes("");
          loadPendingOrders();
        } catch (err: any) {
          console.error(err);
          showToast("error", err.message || "Failed to book goods receipt");
        }
      },
    });
  };

  const toggleExpandReceipt = async (receiptId: string) => {
    if (expandedReceiptId === receiptId) {
      setExpandedReceiptId(null);
    } else {
      setExpandedReceiptId(receiptId);
    }
  };

  const filteredReceipts = receipts.filter((r) => {
    const orderNo = r.order?.orderNumber || "";
    const supplierName = r.order?.supplier?.companyName || "";
    return (
      orderNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.notes || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Sub tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveSubTab("book")}
          className={`flex items-center gap-1.5 py-2.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeSubTab === "book"
              ? "border-primary text-primary"
              : "border-transparent text-slate-400 hover:text-slate-700"
          }`}
        >
          <PlusSquare className="h-4 w-4" />
          <span>{isDe ? "Einbuchen" : "Book Delivery"}</span>
        </button>
        <button
          onClick={() => setActiveSubTab("history")}
          className={`flex items-center gap-1.5 py-2.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeSubTab === "history"
              ? "border-primary text-primary"
              : "border-transparent text-slate-400 hover:text-slate-700"
          }`}
        >
          <History className="h-4 w-4" />
          <span>{isDe ? "Protokolle" : "Receipts Log"}</span>
        </button>
      </div>

      {activeSubTab === "book" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Form and Selection Panel */}
          <div className="card p-6 bg-white shadow-sm border border-slate-100 rounded-xl lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-800">
                {isDe ? "Wareneingang erfassen" : "Record Incoming Delivery"}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Select an open purchase order and confirm the received quantities. Stock levels will update automatically.
              </p>
            </div>

            <div>
              <label className="label font-bold text-slate-700">
                {isDe ? "Offene Bestellung wählen" : "Select Pending Purchase Order"}{" "}
                <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedOrderId}
                onChange={(e) => handleOrderSelectionChange(e.target.value)}
                className="input mt-1.5 h-11 text-sm bg-white"
              >
                <option value="">-- Choose Purchase Order --</option>
                {pendingOrders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.orderNumber} - {o.supplier?.companyName} ({o.status})
                  </option>
                ))}
              </select>
            </div>

            {loading && (
              <div className="flex h-32 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-primary" />
              </div>
            )}

            {!loading && selectedOrder && (
              <form onSubmit={handleBookReceipt} className="space-y-6 pt-4 border-t border-slate-100">
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                    Verify Deliveries
                  </h3>

                  <div className="overflow-hidden rounded-lg border border-slate-200">
                    <table className="w-full text-left text-xs border-collapse bg-white">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          <th className="px-4 py-3">SKU / Part Name</th>
                          <th className="px-4 py-3 text-center">Ordered</th>
                          <th className="px-4 py-3 text-center">Already Received</th>
                          <th className="px-4 py-3 text-center w-36">Qty Received Now</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedOrder.items?.map((item) => {
                          const val = receivedQtys[item.sparePartId] || 0;
                          const pending = item.quantityOrdered - item.quantityReceived;

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
                              <td className="px-4 py-3 text-center text-slate-500 font-medium">
                                {item.quantityReceived}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1.5 justify-end">
                                  <input
                                    type="number"
                                    min="0"
                                    max={pending * 2} // Safety ceiling
                                    className="input h-9 text-xs text-center font-bold"
                                    value={val}
                                    onChange={(e) =>
                                      handleQtyChange(item.sparePartId, Number(e.target.value))
                                    }
                                    required
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleQtyChange(item.sparePartId, pending > 0 ? pending : 0)}
                                    className="text-[9px] font-bold bg-slate-100 hover:bg-slate-200 border text-slate-600 px-1.5 py-1.5 rounded shrink-0"
                                    title="Set to remaining pending quantity"
                                  >
                                    ALL
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <label className="label font-bold text-slate-700">
                    {isDe ? "Bemerkungen / Empfangsnotiz" : "Delivery Notes / Remarks"}
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Package arrived intact. Stored in shelf A-3."
                    className="input mt-1.5 text-sm p-3 h-auto"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-end pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    className="btn btn-primary h-11 px-5 font-semibold text-sm flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>
                      {isDe ? "Wareneingang buchen" : "Book Goods Receipt"}
                    </span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Supplier metadata sidebar info */}
          <div className="card p-6 bg-slate-50 border border-slate-150 rounded-xl space-y-4">
            <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
              Selected Order Overview
            </h3>
            {selectedOrder ? (
              <div className="space-y-3.5 text-sm">
                <div>
                  <span className="text-xs text-slate-400 font-semibold block">Order Reference</span>
                  <span className="font-mono font-black text-slate-800 text-base">
                    {selectedOrder.orderNumber}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-semibold block">Supplier</span>
                  <span className="font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                    <User className="h-4 w-4 text-slate-400" />
                    {selectedOrder.supplier?.companyName}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-semibold block">Order Date</span>
                  <span className="font-medium text-slate-700">
                    {new Date(selectedOrder.orderDate || selectedOrder.createdAt).toLocaleDateString("de-DE")}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-semibold block">Status</span>
                  <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-150 mt-1">
                    {selectedOrder.status}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                Choose a purchase order to view supplier parameters and shipping notes.
              </p>
            )}
          </div>
        </div>
      ) : (
        /* Receipts History Tab */
        <div className="space-y-4">
          <div className="card p-4 flex items-center bg-white shadow-sm w-full max-w-md">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search receipts by order SKU or notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input h-10 pl-10 w-full"
              />
            </div>
          </div>

          <div className="card overflow-hidden bg-white shadow-sm">
            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-primary" />
              </div>
            ) : filteredReceipts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                <FileText className="h-12 w-12 text-slate-300 mb-3" />
                <p className="font-semibold text-lg">No Receipts Recorded</p>
                <p className="text-sm">Historical deliveries will log here once checked in.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-400">
                      <th className="px-6 py-4 w-10"></th>
                      <th className="px-6 py-4">Receipt Date</th>
                      <th className="px-6 py-4">Order Number</th>
                      <th className="px-6 py-4">Supplier</th>
                      <th className="px-6 py-4">Notes / Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredReceipts.map((r) => {
                      const isExpanded = expandedReceiptId === r.id;
                      return (
                        <tr key={r.id} className="hover:bg-slate-50/20 transition-colors">
                          <td className="px-6 py-4">
                            <button
                              onClick={() => toggleExpandReceipt(r.id)}
                              className="p-1 rounded hover:bg-slate-200 text-slate-500"
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </button>
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-800">
                            {new Date(r.receivedDate).toLocaleString("de-DE")}
                          </td>
                          <td className="px-6 py-4 font-mono font-bold text-indigo-700">
                            {r.order?.orderNumber}
                          </td>
                          <td className="px-6 py-4 text-slate-700 font-semibold">
                            {r.order?.supplier?.companyName}
                          </td>
                          <td className="px-6 py-4 text-slate-500 italic max-w-[300px] truncate" title={r.notes || ""}>
                            {r.notes || "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reconciliation Deviation Modal alert */}
      {reconcileResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="card w-full max-w-lg shadow-2xl relative bg-white border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-150 px-5 py-4 bg-slate-50 rounded-t-xl">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                {reconcileResult.hasDeviations ? (
                  <>
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    <span className="text-amber-700">Delivery Deviations Flagged</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                    <span className="text-emerald-700">Delivery Completed Successfully</span>
                  </>
                )}
              </h3>
              <button
                type="button"
                onClick={() => setReconcileResult(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600">
                Goods receipt booking processed. Order status updated to:{" "}
                <span className="font-bold text-slate-800">{reconcileResult.orderStatus}</span>.
              </p>

              {reconcileResult.hasDeviations ? (
                <div className="space-y-3">
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 rounded-lg flex gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                    <div>
                      <span className="font-bold">Reconciliation Alert:</span> The delivery does not
                      match ordered counts. The following items have deficits:
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          <th className="px-4 py-2">Part</th>
                          <th className="px-4 py-2 text-center">Ordered</th>
                          <th className="px-4 py-2 text-center">Received</th>
                          <th className="px-4 py-2 text-center text-red-600">Missing</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {reconcileResult.deviations.map((d: any) => (
                          <tr key={d.sparePartId}>
                            <td className="px-4 py-2 font-semibold text-slate-700">{d.name}</td>
                            <td className="px-4 py-2 text-center font-semibold">{d.ordered}</td>
                            <td className="px-4 py-2 text-center text-slate-600">{d.received}</td>
                            <td className="px-4 py-2 text-center font-bold text-red-600">{d.deviation}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-lg flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>All parts were received in full. No deficits recorded.</span>
                </div>
              )}

              <div className="flex items-center justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReconcileResult(null)}
                  className="btn btn-primary h-10 px-5 text-sm font-semibold"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
