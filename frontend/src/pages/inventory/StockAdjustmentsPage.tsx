import { useEffect, useState } from "react";
import { History, Search, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useAppConfirm } from "../../components/common/ConfirmDialogProvider";
import * as api from "../../api/inventory";
import type { StockAdjustment } from "../../types/inventory";
import { useLanguage } from "../../i18n/LanguageProvider";

export default function StockAdjustmentsPage() {
  const { t, language } = useLanguage();
  const isDe = language === "de";
  const { showToast } = useAppConfirm();
  const [history, setHistory] = useState<StockAdjustment[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const loadHistory = async () => {
    setLoading(true);
    try {
      const list = await api.fetchStockAdjustments();
      setHistory(list);
    } catch (err: any) {
      console.error(err);
      showToast("error", err.message || "Failed to load stock adjustment logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const filteredHistory = history.filter((log) => {
    const partName = log.sparePart?.name || "";
    const partSku = log.sparePart?.itemNumber || "";
    const reason = log.reason || "";
    return (
      partName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partSku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reason.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="card p-4 flex items-center bg-white shadow-sm w-full max-w-md">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={
              isDe
                ? "Suchen nach Teil oder Grund..."
                : "Search logs by part, SKU, or reason..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input h-10 pl-10 w-full"
          />
        </div>
      </div>

      {/* Adjustments Table */}
      <div className="card overflow-hidden bg-white shadow-sm">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-primary" />
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <History className="h-12 w-12 text-slate-300 mb-3" />
            <p className="font-semibold text-lg">No Adjustments Found</p>
            <p className="text-sm">Manual stock overrides and corrections will log here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <th className="px-6 py-4">Date / Time</th>
                  <th className="px-6 py-4">Spare Part</th>
                  <th className="px-6 py-4 text-center">Correction Quantity</th>
                  <th className="px-6 py-4">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredHistory.map((log) => {
                  const isPositive = log.quantityDiff > 0;
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-4 text-slate-600 font-medium">
                        {new Date(log.createdAt).toLocaleString("de-DE")}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-mono text-xs text-slate-400 font-bold">
                          {log.sparePart?.itemNumber || "Deleted SKU"}
                        </div>
                        <div className="font-bold text-slate-800">
                          {log.sparePart?.name || "Deleted Spare Part"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1">
                          {isPositive ? (
                            <div className="flex items-center text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full font-extrabold text-xs">
                              <ArrowUpRight className="h-3.5 w-3.5" />
                              <span>+{log.quantityDiff}</span>
                            </div>
                          ) : (
                            <div className="flex items-center text-red-600 bg-red-50 border border-red-150 px-2.5 py-0.5 rounded-full font-extrabold text-xs">
                              <ArrowDownRight className="h-3.5 w-3.5" />
                              <span>{log.quantityDiff}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded font-semibold uppercase">
                          {log.reason}
                        </span>
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
  );
}
