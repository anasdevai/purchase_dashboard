import { useEffect, useState } from "react";
import { X, Search, Calendar, User, FileText, CheckCircle2 } from "lucide-react";
import { searchCustomers } from "../../api/customers";
import { fetchRepairOrders } from "../../api/repairOrders";
import { createAppointment, updateAppointment, sendAppointmentReminder } from "../../api/appointments";
import type { Customer } from "../../types/customer";
import type { RepairOrder } from "../../types/repairOrder";
import type { AppointmentStatus, AppointmentSource } from "../../types/appointment";
import { useLanguage } from "../../i18n/LanguageProvider";

interface AppointmentFormModalProps {
  isOpen: boolean;
  appointmentId: string | null;
  initialStartTime?: string;
  initialEndTime?: string;
  onClose: () => void;
  onSave: () => void;
}

export function AppointmentFormModal({
  isOpen,
  appointmentId,
  initialStartTime,
  initialEndTime,
  onClose,
  onSave,
}: AppointmentFormModalProps) {
  const { t } = useLanguage();
  const loc = t.appointmentForm;
  const cal = t.calendar;

  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [status, setStatus] = useState<AppointmentStatus>("Booked");
  const [source, setSource] = useState<AppointmentSource>("Manual");
  const [note, setNote] = useState("");

  // Customer selection
  const [customerSearch, setCustomerSearch] = useState("");
  const [customersList, setCustomersList] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  // Device fields (copied from customer/order, editable)
  const [deviceBrand, setDeviceBrand] = useState("");
  const [deviceModel, setDeviceModel] = useState("");
  const [deviceImei, setDeviceImei] = useState("");

  // Repair Order selection
  const [orderSearch, setOrderSearch] = useState("");
  const [ordersList, setOrdersList] = useState<RepairOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<RepairOrder | null>(null);
  const [showOrderDropdown, setShowOrderDropdown] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Load existing appointment data on edit mode
  useEffect(() => {
    if (isOpen) {
      setError("");
      setSuccessMsg("");
      if (appointmentId) {
        setLoading(true);
        import("../../api/appointments")
          .then((api) => api.fetchAppointmentDetail(appointmentId))
          .then((appt) => {
            setTitle(appt.title);
            setStartTime(appt.startTime.slice(0, 16));
            setEndTime(appt.endTime.slice(0, 16));
            setStatus(appt.status);
            setSource(appt.source);
            setNote(appt.note || "");
            setDeviceBrand(appt.deviceBrand || "");
            setDeviceModel(appt.deviceModel || "");
            setDeviceImei(appt.deviceImei || "");

            if (appt.customer) {
              setSelectedCustomer(appt.customer as any);
              setCustomerSearch(appt.customer.name);
            } else {
              setSelectedCustomer(null);
              setCustomerSearch("");
            }

            if (appt.repairOrder) {
              setSelectedOrder(appt.repairOrder as any);
              setOrderSearch(appt.repairOrder.repairOrderNumber);
            } else {
              setSelectedOrder(null);
              setOrderSearch("");
            }
          })
          .catch((err) => {
            console.error(err);
            setError(loc.loadFailed);
          })
          .finally(() => setLoading(false));
      } else {
        // Create mode
        setTitle("");
        setStatus("Booked");
        setSource("Manual");
        setNote("");
        setDeviceBrand("");
        setDeviceModel("");
        setDeviceImei("");
        setSelectedCustomer(null);
        setCustomerSearch("");
        setSelectedOrder(null);
        setOrderSearch("");

        // Use initial times if provided
        const now = new Date();
        const start = initialStartTime
          ? new Date(initialStartTime)
          : new Date(now.getTime() + 60 * 60 * 1000); // 1h from now
        const end = initialEndTime
          ? new Date(initialEndTime)
          : new Date(start.getTime() + 30 * 60 * 1000); // 30 mins duration

        // Format to YYYY-MM-DDTHH:MM local format
        const toLocalISOString = (d: Date) => {
          const tzOffset = d.getTimezoneOffset() * 60000;
          return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
        };

        setStartTime(toLocalISOString(start));
        setEndTime(toLocalISOString(end));
      }
    }
  }, [isOpen, appointmentId, initialStartTime, initialEndTime]);

  // Customer Autocomplete Search
  useEffect(() => {
    if (customerSearch.trim() && !selectedCustomer) {
      const delay = setTimeout(() => {
        searchCustomers(customerSearch)
          .then((res) => {
            setCustomersList(res);
            setShowCustomerDropdown(true);
          })
          .catch(console.error);
      }, 300);
      return () => clearTimeout(delay);
    } else {
      setShowCustomerDropdown(false);
    }
  }, [customerSearch, selectedCustomer]);

  // Order Autocomplete Search
  useEffect(() => {
    if (orderSearch.trim() && !selectedOrder) {
      const delay = setTimeout(() => {
        fetchRepairOrders(orderSearch)
          .then((res) => {
            setOrdersList(res);
            setShowOrderDropdown(true);
          })
          .catch(console.error);
      }, 300);
      return () => clearTimeout(delay);
    } else {
      setShowOrderDropdown(false);
    }
  }, [orderSearch, selectedOrder]);

  const handleCustomerSelect = (cust: Customer) => {
    setSelectedCustomer(cust);
    setCustomerSearch(cust.name);
    setShowCustomerDropdown(false);
  };

  const handleOrderSelect = (order: RepairOrder) => {
    setSelectedOrder(order);
    setOrderSearch(order.repairOrderNumber);
    setShowOrderDropdown(false);
    if (order.brand) setDeviceBrand(order.brand);
    if (order.model) setDeviceModel(order.model);
    if (order.imeiOrSerial) setDeviceImei(order.imeiOrSerial);
  };

  const handleSendReminder = async () => {
    if (!appointmentId) return;
    setLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      await sendAppointmentReminder(appointmentId);
      setSuccessMsg(loc.reminderSent);
    } catch (err: any) {
      setError(err.message || loc.reminderFailed);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end <= start) {
      setError(loc.endTimeAfterStart);
      return;
    }

    setLoading(true);
    const payload = {
      title,
      customerId: selectedCustomer?.id || null,
      deviceBrand: deviceBrand || null,
      deviceModel: deviceModel || null,
      deviceImei: deviceImei || null,
      repairOrderId: selectedOrder?.id || null,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      note: note || null,
      status,
      source,
    };

    try {
      if (appointmentId) {
        await updateAppointment(appointmentId, payload);
      } else {
        await createAppointment(payload);
      }
      onSave();
    } catch (err: any) {
      setError(err.message || loc.saveFailed);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-white rounded-xl shadow-xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">
            {appointmentId ? loc.titleEdit : loc.titleCreate}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 transition text-slate-400">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg font-semibold">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="p-3 bg-green-50 text-green-700 text-xs rounded-lg font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              {successMsg}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              {loc.titleLabel} *
            </label>
            <input
              type="text"
              required
              className="input w-full"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Customer Search Autocomplete */}
          <div className="relative">
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              {loc.searchCustomer}
            </label>
            <div className="relative">
              <input
                type="text"
                className="input w-full pl-10"
                placeholder={loc.customerSearchPlaceholder}
                value={customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  if (selectedCustomer) setSelectedCustomer(null);
                }}
              />
              <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              {selectedCustomer && (
                <div className="absolute right-3 top-3 text-emerald-600">
                  <User className="h-5 w-5" />
                </div>
              )}
            </div>

            {showCustomerDropdown && customersList.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {customersList.map((cust) => (
                  <button
                    key={cust.id}
                    type="button"
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 transition text-sm flex flex-col"
                    onClick={() => handleCustomerSelect(cust)}
                  >
                    <span className="font-semibold text-slate-900">{cust.name}</span>
                    <span className="text-xs text-slate-500">{cust.phone} | {cust.email || "-"}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Repair Order Search Autocomplete */}
          <div className="relative">
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              {loc.linkRepairOrder}
            </label>
            <div className="relative">
              <input
                type="text"
                className="input w-full pl-10"
                placeholder={loc.orderSearchPlaceholder}
                value={orderSearch}
                onChange={(e) => {
                  setOrderSearch(e.target.value);
                  if (selectedOrder) setSelectedOrder(null);
                }}
              />
              <FileText className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              {selectedOrder && (
                <div className="absolute right-3 top-3 text-emerald-600">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              )}
            </div>

            {showOrderDropdown && ordersList.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {ordersList.map((ord) => (
                  <button
                    key={ord.id}
                    type="button"
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 transition text-sm flex flex-col"
                    onClick={() => handleOrderSelect(ord)}
                  >
                    <span className="font-semibold text-slate-900">{ord.repairOrderNumber}</span>
                    <span className="text-xs text-slate-500">{ord.brand} {ord.model} ({ord.status})</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Device details (Brand, Model, IMEI) */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] font-semibold text-slate-700 uppercase mb-1">
                {loc.deviceBrand}
              </label>
              <input
                type="text"
                className="input w-full text-sm"
                value={deviceBrand}
                onChange={(e) => setDeviceBrand(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-700 uppercase mb-1">
                {loc.deviceModel}
              </label>
              <input
                type="text"
                className="input w-full text-sm"
                value={deviceModel}
                onChange={(e) => setDeviceModel(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-700 uppercase mb-1">
                {loc.imeiSerial}
              </label>
              <input
                type="text"
                className="input w-full text-sm"
                value={deviceImei}
                onChange={(e) => setDeviceImei(e.target.value)}
              />
            </div>
          </div>

          {/* Times */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                {loc.startTime} *
              </label>
              <input
                type="datetime-local"
                required
                className="input w-full"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                {loc.endTime} *
              </label>
              <input
                type="datetime-local"
                required
                className="input w-full"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          {/* Status & Source */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                {loc.status} *
              </label>
              <select
                className="input w-full bg-white"
                value={status}
                onChange={(e) => setStatus(e.target.value as AppointmentStatus)}
              >
                <option value="Booked">{cal.statusBooked}</option>
                <option value="Confirmed">{cal.statusConfirmed}</option>
                <option value="Arrived">{cal.statusArrived}</option>
                <option value="Cancelled">{cal.statusCancelled}</option>
                <option value="Voided">{cal.statusVoided}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                {loc.source} *
              </label>
              <select
                className="input w-full bg-white"
                value={source}
                onChange={(e) => setSource(e.target.value as AppointmentSource)}
              >
                <option value="Manual">{cal.sourceManual}</option>
                <option value="Order">{cal.sourceOrder}</option>
                <option value="Website">{cal.sourceWebsite}</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              {loc.internalNotes}
            </label>
            <textarea
              className="input w-full h-20 py-2 resize-none"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-6">
            <div>
              {appointmentId && selectedCustomer?.email && (
                <button
                  type="button"
                  onClick={handleSendReminder}
                  disabled={loading}
                  className="btn btn-outline text-slate-600 text-xs px-3 py-2 border-slate-200 hover:bg-slate-50 disabled:opacity-50"
                >
                  <Calendar className="h-4 w-4 shrink-0 text-slate-400" />
                  {loc.sendReminder}
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-outline border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold px-4 py-2"
              >
                {loc.cancel}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary font-semibold px-5 py-2 disabled:opacity-50"
              >
                {loading ? loc.saving : loc.save}
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}
