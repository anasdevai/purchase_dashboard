import { useEffect, useState } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Download,
  FileText,
  Search,
  Users,
  Grid,
  List,
  Clock,
  Settings,
} from "lucide-react";
import { fetchAppointments, moveAppointment, exportAppointments, deleteAppointment } from "../api/appointments";
import type { Appointment, AppointmentStatus, AppointmentSource } from "../types/appointment";
import { useLanguage } from "../i18n/LanguageProvider";
import { useAppConfirm } from "../components/common/ConfirmDialogProvider";
import { AppointmentFormModal } from "../components/appointments/AppointmentFormModal";
import { getFriendlyErrorMessage, logApiError } from "../utils/apiErrors";

type ViewMode = "day" | "week" | "month" | "list";

export function CalendarPage() {
  const { t } = useLanguage();
  const { confirm, showToast } = useAppConfirm();
  const isDe = t.pages.settings === "Einstellungen";

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  
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

  useEffect(() => {
    loadAppointments();
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
      showToast("success", isDe ? "Termin verschoben." : "Appointment rescheduled successfully.");
      loadAppointments();
    } catch (err) {
      logApiError("move appointment", err);
      showToast("error", isDe ? "Verschieben fehlgeschlagen." : "Failed to reschedule appointment.");
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
      showToast("success", isDe ? "Erfolgreich exportiert." : "Exported successfully.");
    } catch (err) {
      logApiError("export appointments", err);
      showToast("error", isDe ? "Export fehlgeschlagen." : "Export failed.");
    }
  };

  const handleDelete = (appt: Appointment) => {
    confirm({
      title: isDe ? "Termin löschen?" : "Delete appointment?",
      message: isDe
        ? `Möchten Sie den Termin "${appt.title}" wirklich dauerhaft löschen?`
        : `Are you sure you want to permanently delete the appointment "${appt.title}"?`,
      confirmLabel: isDe ? "Löschen" : "Delete",
      cancelLabel: isDe ? "Abbrechen" : "Cancel",
      variant: "danger",
      onConfirm: async () => {
        try {
          await deleteAppointment(appt.id);
          showToast("success", isDe ? "Termin gelöscht." : "Appointment deleted.");
          loadAppointments();
        } catch (err) {
          logApiError("delete appointment", err);
          showToast("error", isDe ? "Löschen fehlgeschlagen." : "Failed to delete appointment.");
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

    const weekdayHeaders = isDe
      ? ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]
      : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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
                      title={`${appt.title} (${new Date(appt.startTime).toLocaleTimeString("de-DE", {
                        hour: "2-digit",
                        minute: "2-digit"
                      })})`}
                    >
                      {new Date(appt.startTime).toLocaleTimeString("de-DE", {
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
            <div className="py-3 px-4 border-r border-slate-200 text-center">{isDe ? "Uhrzeit" : "Time"}</div>
            {days.map((d) => {
              const isToday = new Date().toDateString() === d.toDateString();
              return (
                <div key={d.toString()} className="py-3 text-center flex flex-col items-center justify-center">
                  <span>
                    {d.toLocaleDateString(isDe ? "de-DE" : "en-US", { weekday: "short" })}
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
                        {new Date(appt.startTime).toLocaleTimeString("de-DE", {
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
                      {isDe ? "Termin eintragen" : "Schedule slot"}
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
              {isDe ? "Tagesübersicht" : "Day Summary"}
            </h3>
            <div className="space-y-3">
              {dayAppointments.length === 0 ? (
                <p className="text-sm text-slate-500 italic">
                  {isDe ? "Keine Termine für diesen Tag." : "No appointments for this day."}
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
                      {new Date(appt.endTime).toLocaleTimeString("de-DE", {
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
            {isDe ? "Keine Termine gefunden." : "No appointments found."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4">{isDe ? "Titel" : "Title"}</th>
                  <th className="px-6 py-4">{isDe ? "Kunde" : "Customer"}</th>
                  <th className="px-6 py-4">{isDe ? "Startzeit" : "Start Time"}</th>
                  <th className="px-6 py-4">{isDe ? "Endzeit" : "End Time"}</th>
                  <th className="px-6 py-4">{isDe ? "Dauer" : "Duration"}</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">{isDe ? "Quelle" : "Source"}</th>
                  <th className="px-6 py-4 text-right">{isDe ? "Aktionen" : "Actions"}</th>
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
                      {new Date(appt.startTime).toLocaleString(isDe ? "de-DE" : "en-US")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                      {new Date(appt.endTime).toLocaleString(isDe ? "de-DE" : "en-US")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-medium">
                      {appt.duration} Min
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
                          {isDe ? "Bearbeiten" : "Edit"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(appt)}
                          className="btn btn-outline border-red-200 text-red-600 hover:bg-red-50 px-2 py-1"
                        >
                          {isDe ? "Löschen" : "Delete"}
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
      return currentDate.toLocaleDateString(isDe ? "de-DE" : "en-US", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
      });
    }
    if (viewMode === "week") {
      const days = getWeekDays(currentDate);
      const start = days[0].toLocaleDateString(isDe ? "de-DE" : "en-US", { day: "numeric", month: "short" });
      const end = days[6].toLocaleDateString(isDe ? "de-DE" : "en-US", { day: "numeric", month: "short", year: "numeric" });
      return `${start} – ${end}`;
    }
    return currentDate.toLocaleDateString(isDe ? "de-DE" : "en-US", {
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
            {isDe ? "Kalender & Termine" : "Calendar & Appointments"}
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-500">
            {isDe
              ? "Planen Sie Kundentermine und Abholungen aus Reparaturen."
              : "Manage customer booking schedules and pickup tasks."}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => openCreateModal()}
            className="btn btn-primary h-11 px-4 text-sm font-semibold"
          >
            <Plus className="h-4 w-4" />
            {isDe ? "Termin anlegen" : "New Appointment"}
          </button>
          <button
            type="button"
            onClick={() => handleExport("csv")}
            className="btn btn-outline h-11 px-3 border-slate-200 hover:bg-slate-50"
            title="CSV Export"
          >
            <Download className="h-4 w-4" />
            CSV
          </button>
          <button
            type="button"
            onClick={() => handleExport("ical")}
            className="btn btn-outline h-11 px-3 border-slate-200 hover:bg-slate-50"
            title="iCal Export"
          >
            <FileText className="h-4 w-4" />
            iCal
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
            {isDe ? "Heute" : "Today"}
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
              {mode === "day" ? (isDe ? "Tag" : "Day") :
               mode === "week" ? (isDe ? "Woche" : "Week") :
               mode === "month" ? (isDe ? "Monat" : "Month") : (isDe ? "Liste" : "List")}
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
            placeholder={isDe ? "Suchen nach Titel, Kunde, Notiz..." : "Search title, customer, notes..."}
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
            <option value="all">{isDe ? "Alle Statusse" : "All Statuses"}</option>
            <option value="Booked">{isDe ? "Gebucht" : "Booked"}</option>
            <option value="Confirmed">{isDe ? "Bestätigt" : "Confirmed"}</option>
            <option value="Arrived">{isDe ? "Eingetroffen" : "Arrived"}</option>
            <option value="Cancelled">{isDe ? "Storniert" : "Cancelled"}</option>
            <option value="Voided">{isDe ? "Ungültig" : "Voided"}</option>
          </select>
        </div>

        {/* Source filter */}
        <div>
          <select
            className="input h-10 w-full bg-white text-sm"
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
          >
            <option value="all">{isDe ? "Alle Quellen" : "All Sources"}</option>
            <option value="Manual">{isDe ? "Manuell" : "Manual"}</option>
            <option value="Order">{isDe ? "Aus Auftrag" : "From Order"}</option>
            <option value="Website">Website</option>
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
