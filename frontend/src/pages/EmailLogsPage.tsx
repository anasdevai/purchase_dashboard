import { useEffect, useState } from "react";
import { Mail, Eye, Calendar, ChevronLeft, ChevronRight, X, AlertTriangle } from "lucide-react";
import { useLanguage } from "../i18n/LanguageProvider";
import { useAppConfirm } from "../components/common/ConfirmDialogProvider";
import { fetchEmailLogs } from "../api/email";
import type { EmailLog } from "../types/email";
import { getFriendlyErrorMessage, logApiError } from "../utils/apiErrors";

const localizations = {
  de: {
    title: "E-Mail-Protokolle",
    description: "Verlauf aller automatisch und manuell gesendeten E-Mails.",
    tableTo: "Empfänger",
    tableSubject: "Betreff",
    tableDate: "Sendedatum",
    tableStatus: "Status",
    tableActions: "Aktionen",
    statusSent: "Gesendet",
    statusFailed: "Fehlgeschlagen",
    noLogs: "Keine E-Mail-Protokolle gefunden.",
    inspectTitle: "E-Mail-Details",
    inspectSubject: "Betreff:",
    inspectTo: "Empfänger:",
    inspectDate: "Gesendet am:",
    inspectBody: "E-Mail-Inhalt:",
    errorDetails: "Fehlerdetails:",
    page: "Seite",
    of: "von",
  },
  en: {
    title: "Email Logs",
    description: "History of all outgoing transactional and notification emails.",
    tableTo: "Recipient",
    tableSubject: "Subject",
    tableDate: "Sent Date",
    tableStatus: "Status",
    tableActions: "Actions",
    statusSent: "Sent",
    statusFailed: "Failed",
    noLogs: "No email logs found.",
    inspectTitle: "Email Details",
    inspectSubject: "Subject:",
    inspectTo: "Recipient:",
    inspectDate: "Sent Date:",
    inspectBody: "Email Body:",
    errorDetails: "Error Details:",
    page: "Page",
    of: "of",
  },
};

export function EmailLogsPage() {
  const { t, language } = useLanguage();
  const { showToast } = useAppConfirm();
  const isDe = language === "de";
  const loc = isDe ? localizations.de : localizations.en;

  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);

  const limit = 15;

  const loadLogs = async (page: number) => {
    setLoading(true);
    try {
      const response = await fetchEmailLogs(page, limit);
      setLogs(response.logs);
      setTotalPages(response.pagination.totalPages || 1);
      setCurrentPage(response.pagination.page || 1);
    } catch (err) {
      logApiError("load email logs", err);
      showToast("error", getFriendlyErrorMessage(err, "load", t));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs(currentPage);
  }, [currentPage]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString(isDe ? "de-DE" : "en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">{loc.title}</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-600">{loc.description}</p>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-primary" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-2 text-slate-500">
            <Mail className="h-8 w-8 text-slate-300" />
            <span className="text-sm font-medium">{loc.noLogs}</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4">{loc.tableTo}</th>
                  <th className="px-6 py-4">{loc.tableSubject}</th>
                  <th className="px-6 py-4">{loc.tableDate}</th>
                  <th className="px-6 py-4">{loc.tableStatus}</th>
                  <th className="px-6 py-4 text-right">{loc.tableActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4 font-medium text-slate-900">{log.to}</td>
                    <td className="px-6 py-4 text-slate-600 max-w-xs truncate">{log.subject}</td>
                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        {formatDate(log.sentAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          log.status === "Sent"
                            ? "bg-green-50 text-green-700 ring-1 ring-green-600/10"
                            : "bg-red-50 text-red-700 ring-1 ring-red-600/10"
                        }`}
                      >
                        {log.status === "Sent" ? loc.statusSent : loc.statusFailed}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setSelectedLog(log)}
                        className="inline-flex items-center justify-center rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
                        title={loc.inspectTitle}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 bg-white px-6 py-4">
            <div className="text-xs text-slate-500 font-medium">
              {loc.page} {currentPage} {loc.of} {totalPages}
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

      {/* Log Inspection Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="relative flex flex-col w-full max-w-2xl max-h-[85vh] rounded-2xl bg-white shadow-xl animate-scaleIn overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-2 text-slate-900 font-semibold">
                <Mail className="h-5 w-5 text-slate-500" />
                <span>{loc.inspectTitle}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-slate-50 rounded-xl p-4 border border-slate-150">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    {loc.inspectTo}
                  </span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">{selectedLog.to}</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    {loc.inspectDate}
                  </span>
                  <span className="text-slate-700 mt-0.5 block">{formatDate(selectedLog.sentAt)}</span>
                </div>
                <div className="md:col-span-2 border-t border-slate-200 pt-3">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    {loc.inspectSubject}
                  </span>
                  <span className="font-semibold text-slate-900 mt-0.5 block">{selectedLog.subject}</span>
                </div>
              </div>

              {/* Error warning box if log failed */}
              {selectedLog.status === "Failed" && selectedLog.error && (
                <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-900">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
                  <div>
                    <span className="font-semibold block">{loc.errorDetails}</span>
                    <p className="mt-1 font-mono text-xs break-all leading-relaxed text-red-800">{selectedLog.error}</p>
                  </div>
                </div>
              )}

              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  {loc.inspectBody}
                </span>
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 font-mono text-xs whitespace-pre-wrap leading-relaxed text-slate-800 shadow-inner max-h-60 overflow-y-auto">
                  {selectedLog.body}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-100 px-6 py-4 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="btn btn-outline border border-slate-200 hover:bg-slate-50 h-10 px-5 text-sm font-semibold text-slate-700"
              >
                {isDe ? "Schließen" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
