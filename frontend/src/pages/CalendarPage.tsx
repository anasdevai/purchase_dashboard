import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Download,
  FileText,
  Search,
  Users,
  Clock,
} from "lucide-react";
import {
  fetchAppointments,
  moveAppointment,
  exportAppointments,
  deleteAppointment,
  fetchGoogleAuthUrl,
  fetchGoogleCalendarStatus,
  disconnectGoogleCalendar,
} from "../api/appointments";
import type { Appointment, AppointmentStatus } from "../types/appointment";
import { useLanguage } from "../i18n/LanguageProvider";
import { useAppConfirm } from "../components/common/ConfirmDialogProvider";
import { AppointmentFormModal } from "../components/appointments/AppointmentFormModal";
import { getFriendlyErrorMessage, logApiError } from "../utils/apiErrors";

type ViewMode = "day" | "week" | "month" | "list";

export function CalendarPage() {
  const { t, language } = useLanguage();
  const { confirm, showToast } = useAppConfirm();
  const cal = t.calendar;
  const locale = language === "de" ? "de-DE" : "en-US";

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [googleConnected, setGoogleConnected] = useState<boolean>(false);
  
  // Modals and form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedApptId, setSelectedApptId] = useState<string | null>(null);
  const [initialStart, setInitialStart] = useState<string | undefined>(undefined);
  const [initialEnd, setInitialEnd] = useState<string | undefined>(undefined);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");

  const loadAppointments = async () => {
    setLoading(true);
    try {
      // Fetch all appointments (optionally filter or restrict on range)
      const data = await fetchAppointments();
      setAppointments(data);
    } catch (err) {
      logApiError("load appointments", err);
      showToast("error", getFriendlyErrorMessage(err, "load", t));
    } finally {
      setLoading(false);
    }
  };

  const checkGoogleStatus = async () => {
    try {
      const res = await fetchGoogleCalendarStatus();
      setGoogleConnected(res.connected);
    } catch (err) {
      console.error("Failed to fetch Google Calendar status:", err);
    }
  };

  const handleConnectGoogle = async () => {
    try {
      const url = await fetchGoogleAuthUrl();
      window.location.href = url;
    } catch (err) {
      logApiError("fetch google auth url", err);
      showToast("error", cal.googleConnectFailed);
    }
  };

  const handleDisconnectGoogle = () => {
    confirm({
      title: cal.disconnectTitle,
      message: cal.disconnectMessage,
      confirmLabel: cal.disconnect,
      cancelLabel: t.common.cancel,
      variant: "danger",
      onConfirm: async () => {
        try {
          await disconnectGoogleCalendar();
          setGoogleConnected(false);
          showToast("success", cal.disconnected);
        } catch (err) {
          logApiError("disconnect google", err);
          showToast("error", cal.disconnectFailed);
        }
      },
    });
  };

  useEffect(() => {
    loadAppointments();
    checkGoogleStatus();

    const params = new URLSearchParams(window.location.search);
    if (params.get("google_connected") === "true") {
      showToast("success", cal.connectedSuccess);
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);

  const handlePrevDate = () => {
    const next = new Date(currentDate);
    if (viewMode === "day") next.setDate(next.getDate() - 1);
    else if (viewMode === "week") next.setDate(next.getDate() - 7);
    else if (viewMode === "month") next.setMonth(next.getMonth() - 1);
    setCurrentDate(next);
  };

  const handleNextDate = () => {
    const next = new Date(currentDate);
    if (viewMode === "day") next.setDate(next.getDate() + 1);
    else if (viewMode === "week") next.setDate(next.getDate() + 7);
    else if (viewMode === "month") next.setMonth(next.getMonth() + 1);
    setCurrentDate(next);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleDragStart = (e: React.DragEvent, apptId: string) => {
    e.dataTransfer.setData("text/plain", apptId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetDateStr: string) => {
    e.preventDefault();
    const apptId = e.dataTransfer.getData("text/plain");
    const appt = appointments.find((a) => a.id === apptId);
    if (!appt) return;

    try {
      const originalStart = new Date(appt.startTime);
      const originalEnd = new Date(appt.endTime);
      const durationMs = originalEnd.getTime() - originalStart.getTime();

      const newStart = new Date(targetDateStr);
      // Keep the original hour and minutes
      newStart.setHours(originalStart.getHours(), originalStart.getMinutes(), 0, 0);

      const newEnd = new Date(newStart.getTime() + durationMs);

      await moveAppointment(apptId, newStart.toISOString(), newEnd.toISOString());
      showToast("success", cal.rescheduled);
      loadAppointments();
    } catch (err) {
      logApiError("move appointment", err);
      showToast("error", cal.rescheduleFailed);
    }
  };

  const handleExport = async (format: "csv" | "ical") => {
    try {
      const blob = await exportAppointments(format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `appointments_export_${new Date().toISOString().split("T")[0]}.${format === "ical" ? "ics" : "csv"}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast("success", cal.exported);
    } catch (err) {
      logApiError("export appointments", err);
      showToast("error", cal.exportFailed);
    }
  };

  const handleDelete = (appt: Appointment) => {
    confirm({
      title: cal.deleteTitle,
      message: cal.deleteMessage,
      confirmLabel: cal.delete,
      cancelLabel: t.common.cancel,
      variant: "danger",
      onConfirm: async () => {
        try {
          await deleteAppointment(appt.id);
          showToast("success", cal.deleted);
          loadAppointments();
        } catch (err) {
          logApiError("delete appointment", err);
          showToast("error", cal.deleteFailed);
        }
      },
    });
  };

  const openCreateModal = (start?: string, end?: string) => {
    setSelectedApptId(null);
    setInitialStart(start);
    setInitialEnd(end);
    setIsModalOpen(true);
  };

  const openEditModal = (id: string) => {
    setSelectedApptId(id);
    setIsModalOpen(true);
  };

  const handleModalSave = () => {
    setIsModalOpen(false);
    loadAppointments();
  };

  // Helper date logic
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    // 0: Sunday, 1: Monday, ... 6: Saturday
    let day = new Date(year, month, 1).getDay();
    // Convert to European standard (0: Monday, 6: Sunday)
    return day === 0 ? 6 : day - 1;
  };

  const getWeekDays = (date: Date) => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
    startOfWeek.setDate(diff);

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      days.push(d);
    }
    return days;
  };

  // Filters logic
  const filteredAppointments = appointments.filter((appt) => {
    const matchesSearch =
      appt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (appt.customer?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (appt.deviceModel || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (appt.note || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || appt.status === statusFilter;
    const matchesSource = sourceFilter === "all" || appt.source === sourceFilter;

    return matchesSearch && matchesStatus && matchesSource;
  });

  const getStatusColor = (status: AppointmentStatus) => {
    switch (status) {
      case "Booked":
        return "bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100/80";
      case "Confirmed":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/80";
      case "Arrived":
        return "bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100/80";
      case "Cancelled":
        return "bg-rose-50 text-rose-600 border-rose-200 line-through opacity-70 hover:bg-rose-100/80";
      case "Voided":
        return "bg-slate-50 text-slate-600 border-slate-200 opacity-60 hover:bg-slate-100/80";
      default:
        return "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100/80";
    }
  };

  // Render subcomponents for Views
  const renderMonthView = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDayIndex = getFirstDayOfMonth(currentDate);
    const blanks = Array(firstDayIndex).fill(null);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const weekdayHeaders = Array.from({ length: 7 }, (_, i) =>
      new Date(2024, 0, 1 + i).toLocaleDateString(locale, { weekday: "short" })
    );

    return (
      <div className="card overflow-hidden border border-slate-200/80">
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-bold text-slate-500 uppercase tracking-wide">
          {weekdayHeaders.map((day) => (
            <div key={day} className="py-3">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 bg-slate-100/40 gap-px">
          {/* Leading blank spaces */}
          {blanks.map((_, i) => (
            <div key={`blank-${i}`} className="bg-white min-h-[120px] p-2" />
          ))}

          {/* Actual Month Days */}
          {days.map((day) => {
            const thisDate = new Date(year, month, day);
            const dateStr = thisDate.toDateString();
            const ISOStartStr = new Date(year, month, day, 10, 0, 0).toISOString();

            const dayAppointments = filteredAppointments.filter((a) => {
              return new Date(a.startTime).toDateString() === dateStr;
            });

            const isToday = new Date().toDateString() === dateStr;

            return (
              <div
                key={`day-${day}`}
                className={`bg-white min-h-[120px] p-2 flex flex-col transition hover:bg-slate-50/50 group relative`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, thisDate.toISOString())}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`inline-flex items-center justify-center text-xs font-bold w-6 h-6 rounded-full ${
                      isToday
                        ? "bg-primary text-white"
                        : "text-slate-700"
                    }`}
                  >
                    {day}
                  </span>
                  <button
                    type="button"
                    onClick={() => openCreateModal(ISOStartStr)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded bg-slate-100 hover:bg-primary hover:text-white transition text-slate-500 cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-1 max-h-[85px] scrollbar-thin">
                  {dayAppointments.map((appt) => (
                    <div
                      key={appt.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, appt.id)}
                      onClick={() => openEditModal(appt.id)}
                      className={`text-[10px] px-2 py-1 rounded border font-semibold cursor-grab active:cursor-grabbing truncate transition shadow-sm ${getStatusColor(
                        appt.status
                      )}`}
                      title={`${appt.title} (${new Date(appt.startTime).toLocaleTimeString(locale, {
                        hour: "2-digit",
                        minute: "2-digit"
                      })})`}
                    >
                      {new Date(appt.startTime).toLocaleTimeString(locale, {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}{" "}
                      {appt.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const days = getWeekDays(currentDate);
    const hourRows = Array.from({ length: 12 }, (_, i) => i + 8); // 8:00 to 19:00

    return (
      <div className="card overflow-x-auto border border-slate-200/80">
        <div className="min-w-[800px]">
          {/* Header row */}
          <div className="grid grid-cols-8 border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wide">
            <div className="py-3 px-4 border-r border-slate-200 text-center">{cal.time}</div>
            {days.map((d) => {
              const isToday = new Date().toDateString() === d.toDateString();
              return (
                <div key={d.toString()} className="py-3 text-center flex flex-col items-center justify-center">
                  <span>
                    {d.toLocaleDateString(locale, { weekday: "short" })}
                  </span>
                  <span className={`mt-0.5 inline-flex items-center justify-center text-xs font-bold w-5 h-5 rounded-full ${isToday ? "bg-primary text-white" : "text-slate-700"}`}>
                    {d.getDate()}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Time Grid Rows */}
          <div className="divide-y divide-slate-100">
            {hourRows.map((hour) => (
              <div key={hour} className="grid grid-cols-8 min-h-[50px]">
                {/* Time label */}
                <div className="py-3 px-4 border-r border-slate-200 text-slate-400 text-xs font-semibold text-center flex items-center justify-center">
                  {String(hour).padStart(2, "0")}:00
                </div>

                {/* Day Columns */}
                {days.map((dayDate) => {
                  const targetTime = new Date(dayDate);
                  targetTime.setHours(hour, 0, 0, 0);
                  const dateStr = targetTime.toDateString();

                  const hourAppointments = filteredAppointments.filter((a) => {
                    const start = new Date(a.startTime);
                    return start.toDateString() === dateStr && start.getHours() === hour;
                  });

                  return (
                    <div
                      key={dayDate.toString() + hour}
                      className="p-1 flex flex-col gap-1 transition hover:bg-slate-50/30 min-h-[50px] relative"
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, targetTime.toISOString())}
                      onDoubleClick={() => openCreateModal(targetTime.toISOString())}
                    >
                      {hourAppointments.map((appt) => (
                        <div
                          key={appt.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, appt.id)}
                          onClick={() => openEditModal(appt.id)}
                          className={`text-[10px] p-1.5 rounded border font-semibold cursor-grab active:cursor-grabbing truncate transition shadow-sm ${getStatusColor(
                            appt.status
                          )}`}
                          title={`${appt.title} - ${appt.note || ""}`}
                        >
                          {appt.title}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const hourRows = Array.from({ length: 12 }, (_, i) => i + 8); // 8:00 to 19:00
    const dateStr = currentDate.toDateString();
    const dayAppointments = filteredAppointments.filter(
      (a) => new Date(a.startTime).toDateString() === dateStr
    );

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Hour Grid Column */}
        <div className="card md:col-span-2 border border-slate-200/80 overflow-hidden divide-y divide-slate-100">
          {hourRows.map((hour) => {
            const targetTime = new Date(currentDate);
            targetTime.setHours(hour, 0, 0, 0);

            const hourAppointments = dayAppointments.filter(
              (a) => new Date(a.startTime).getHours() === hour
            );

            return (
              <div
                key={hour}
                className="flex min-h-[60px] transition hover:bg-slate-50/20"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, targetTime.toISOString())}
                onDoubleClick={() => openCreateModal(targetTime.toISOString())}
              >
                <div className="w-20 p-4 text-xs font-semibold text-slate-400 text-center border-r border-slate-100 flex items-center justify-center">
                  {String(hour).padStart(2, "0")}:00
                </div>
                <div className="flex-1 p-2 flex flex-wrap gap-2 items-center">
                  {hourAppointments.map((appt) => (
                    <div
                      key={appt.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, appt.id)}
                      onClick={() => openEditModal(appt.id)}
                      className={`text-xs px-3 py-1.5 rounded-lg border font-semibold cursor-grab active:cursor-grabbing truncate transition shadow-sm ${getStatusColor(
                        appt.status
                      )}`}
                    >
                      <span className="font-bold mr-1">
                        {new Date(appt.startTime).toLocaleTimeString(locale, {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                      {appt.title}
                    </div>
                  ))}
                  {hourAppointments.length === 0 && (
                    <button
                      onClick={() => openCreateModal(targetTime.toISOString())}
                      className="opacity-0 hover:opacity-100 text-xs text-slate-400 flex items-center gap-1 hover:text-primary transition"
                    >
                      <Plus className="h-3 w-3" />
                      {cal.scheduleSlot}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Sidebar Summary Column */}
        <div className="space-y-4">
          <div className="card p-5 border border-slate-200/80">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">
              {cal.daySummary}
            </h3>
            <div className="space-y-3">
              {dayAppointments.length === 0 ? (
                <p className="text-sm text-slate-500 italic">
                  {cal.noAppointmentsDay}
                </p>
              ) : (
                dayAppointments.map((appt) => (
                  <div
                    key={appt.id}
                    onClick={() => openEditModal(appt.id)}
                    className="p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition cursor-pointer border-l-4 border-primary"
                  >
                    <div className="font-bold text-sm text-slate-800">{appt.title}</div>
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(appt.startTime).toLocaleTimeString("de-DE", {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}{" "}
                      -{" "}
                      {new Date(appt.endTime).toLocaleTimeString(locale, {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </div>
                    {appt.customer && (
                      <div className="text-xs text-slate-600 mt-1.5 font-medium flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-slate-400" />
                        {appt.customer.name}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderListView = () => {
    return (
      <div className="card border border-slate-200/80 overflow-hidden">
        {filteredAppointments.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            {cal.noAppointments}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4">{cal.title}</th>
                  <th className="px-6 py-4">{cal.customer}</th>
                  <th className="px-6 py-4">{cal.startTime}</th>
                  <th className="px-6 py-4">{cal.endTime}</th>
                  <th className="px-6 py-4">{cal.duration}</th>
                  <th className="px-6 py-4">{t.table.status}</th>
                  <th className="px-6 py-4">{cal.source}</th>
                  <th className="px-6 py-4 text-right">{cal.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAppointments.map((appt) => (
                  <tr key={appt.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4 font-bold text-slate-800">{appt.title}</td>
                    <td className="px-6 py-4">
                      {appt.customer ? (
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900">{appt.customer.name}</span>
                          <span className="text-xs text-slate-500">{appt.customer.phone}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                      {new Date(appt.startTime).toLocaleString(locale)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                      {new Date(appt.endTime).toLocaleString(locale)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-medium">
                      {appt.duration}{cal.minutesShort}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getStatusColor(appt.status)}`}>
                        {appt.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500 text-xs">
                      {appt.source}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(appt.id)}
                          className="btn btn-outline border-slate-200 hover:bg-slate-50 text-slate-700 px-2 py-1"
                        >
                          {cal.edit}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(appt)}
                          className="btn btn-outline border-red-200 text-red-600 hover:bg-red-50 px-2 py-1"
                        >
                          {cal.delete}
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
    );
  };

  const getHeaderDateString = () => {
    if (viewMode === "day") {
      return currentDate.toLocaleDateString(locale, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
      });
    }
    if (viewMode === "week") {
      const days = getWeekDays(currentDate);
      const start = days[0].toLocaleDateString(locale, { day: "numeric", month: "short" });
      const end = days[6].toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });
      return `${start} – ${end}`;
    }
    return currentDate.toLocaleDateString(locale, {
      month: "long",
      year: "numeric"
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
            {cal.pageTitle}
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-500">
            {cal.pageDescription}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => openCreateModal()}
            className="btn btn-primary h-11 px-4 text-sm font-semibold"
          >
            <Plus className="h-4 w-4" />
            {cal.newAppointment}
          </button>
          {googleConnected ? (
            <button
              type="button"
              onClick={handleDisconnectGoogle}
              className="btn bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-slate-700 h-11 px-4 text-sm font-semibold flex items-center gap-2"
              title={cal.disconnectGoogleTooltip}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{cal.googleConnectedLabel}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleConnectGoogle}
              className="btn btn-outline border-slate-200 hover:bg-slate-50 text-slate-700 h-11 px-4 text-sm font-semibold flex items-center gap-2"
              title={cal.connectGoogleLabel}
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              <span>{cal.connectGoogleLabel}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => handleExport("csv")}
            className="btn btn-outline h-11 px-3 border-slate-200 hover:bg-slate-50"
            title={cal.exportCsv}
          >
            <Download className="h-4 w-4" />
            {cal.exportCsv}
          </button>
          <button
            type="button"
            onClick={() => handleExport("ical")}
            className="btn btn-outline h-11 px-3 border-slate-200 hover:bg-slate-50"
            title={cal.exportIcal}
          >
            <FileText className="h-4 w-4" />
            {cal.exportIcal}
          </button>
        </div>
      </div>

      {/* Navigation controls & views switcher */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
        
        {/* Time navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevDate}
            className="p-2 rounded-lg hover:bg-slate-100 border border-slate-200 transition text-slate-600"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={handleToday}
            className="btn btn-outline px-4 py-1.5 text-xs border-slate-200 text-slate-700 hover:bg-slate-50 font-bold"
          >
            {cal.today}
          </button>
          <button
            onClick={handleNextDate}
            className="p-2 rounded-lg hover:bg-slate-100 border border-slate-200 transition text-slate-600"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <h2 className="text-base font-bold text-slate-800 ml-2">
            {getHeaderDateString()}
          </h2>
        </div>

        {/* View Swapper */}
        <div className="flex bg-slate-100 p-1 rounded-lg">
          {(["day", "week", "month", "list"] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition capitalize ${
                viewMode === mode
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {mode === "day" ? cal.day :
               mode === "week" ? cal.week :
               mode === "month" ? cal.month : cal.list}
            </button>
          ))}
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            className="input pl-10 h-10 w-full text-sm"
            placeholder={cal.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Status filter */}
        <div>
          <select
            className="input h-10 w-full bg-white text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">{cal.allStatuses}</option>
            <option value="Booked">{cal.statusBooked}</option>
            <option value="Confirmed">{cal.statusConfirmed}</option>
            <option value="Arrived">{cal.statusArrived}</option>
            <option value="Cancelled">{cal.statusCancelled}</option>
            <option value="Voided">{cal.statusVoided}</option>
          </select>
        </div>

        {/* Source filter */}
        <div>
          <select
            className="input h-10 w-full bg-white text-sm"
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
          >
            <option value="all">{cal.allSources}</option>
            <option value="Manual">{cal.sourceManual}</option>
            <option value="Order">{cal.sourceOrder}</option>
            <option value="Website">{cal.sourceWebsite}</option>
          </select>
        </div>
      </div>

      {/* Render selected view */}
      {loading ? (
        <div className="flex h-64 items-center justify-center bg-white rounded-xl border border-slate-200/80 shadow-sm">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-primary" />
        </div>
      ) : (
        <>
          {viewMode === "day" && renderDayView()}
          {viewMode === "week" && renderWeekView()}
          {viewMode === "month" && renderMonthView()}
          {viewMode === "list" && renderListView()}
        </>
      )}

      {/* Appointment Creation/Edit Form Modal */}
      <AppointmentFormModal
        isOpen={isModalOpen}
        appointmentId={selectedApptId}
        initialStartTime={initialStart}
        initialEndTime={initialEnd}
        onClose={() => setIsModalOpen(false)}
        onSave={handleModalSave}
      />

    </div>
  );
}
