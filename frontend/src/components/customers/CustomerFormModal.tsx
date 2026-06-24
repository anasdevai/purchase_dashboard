import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageProvider";
import { useAppConfirm } from "../common/ConfirmDialogProvider";
import { createCustomer, updateCustomer, fetchCustomerDetail } from "../../api/customers";
import type { CustomerPayload } from "../../types/customer";
import { getFriendlyErrorMessage, logApiError } from "../../utils/apiErrors";

export interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  customerId?: string | null;
}

export function CustomerFormModal({ isOpen, onClose, onSave, customerId }: CustomerFormModalProps) {
  const { t, language } = useLanguage();
  const { showToast } = useAppConfirm();
  const loc = t.customerForm;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [salutation, setSalutation] = useState<"Mr" | "Ms" | "Diverse" | "">("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [company, setCompany] = useState("");
  const [vatId, setVatId] = useState("");
  const [street, setStreet] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [newsletter, setNewsletter] = useState(false);
  const [notes, setNotes] = useState("");

  // Validation Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) return;

    // Reset Form on Open
    setSalutation("");
    setFirstName("");
    setLastName("");
    setCompany("");
    setVatId("");
    setStreet("");
    setZipCode("");
    setCity("");
    setPhone("");
    setEmail("");
    setDateOfBirth("");
    setNewsletter(false);
    setNotes("");
    setErrors({});

    if (customerId) {
      const loadCustomer = async () => {
        setLoading(true);
        try {
          const res = await fetchCustomerDetail(customerId);
          const c = res.customer;
          setSalutation(c.salutation || "");
          setFirstName(c.firstName || "");
          setLastName(c.lastName || "");
          setCompany(c.company || "");
          setVatId(c.vatId || "");
          setStreet(c.street || "");
          setZipCode(c.zipCode || "");
          setCity(c.city || "");
          setPhone(c.phone || "");
          setEmail(c.email || "");
          if (c.dateOfBirth) {
            // Convert to YYYY-MM-DD for date input
            const date = new Date(c.dateOfBirth);
            const formatted = date.toISOString().split("T")[0];
            setDateOfBirth(formatted);
          }
          setNewsletter(c.newsletter || false);
          setNotes(c.notes || "");
        } catch (err) {
          logApiError("fetch customer details for edit", err);
          showToast("error", getFriendlyErrorMessage(err, "load", t));
          onClose();
        } finally {
          setLoading(false);
        }
      };
      void loadCustomer();
    }
  }, [isOpen, customerId]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!firstName.trim()) newErrors.firstName = loc.errRequired;
    if (!lastName.trim()) newErrors.lastName = loc.errRequired;
    if (!street.trim()) newErrors.street = loc.errRequired;
    if (!zipCode.trim()) newErrors.zipCode = loc.errRequired;
    if (!city.trim()) newErrors.city = loc.errRequired;
    if (!phone.trim()) newErrors.phone = loc.errRequired;
    if (!email.trim()) {
      newErrors.email = loc.errRequired;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = loc.errEmail;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    const payload: CustomerPayload = {
      salutation: salutation || null,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      company: company.trim() || null,
      vatId: vatId.trim() || null,
      street: street.trim(),
      zipCode: zipCode.trim(),
      city: city.trim(),
      phone: phone.trim(),
      email: email.trim(),
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth).toISOString() : null,
      newsletter,
      notes: notes.trim() || null,
    };

    try {
      if (customerId) {
        await updateCustomer(customerId, payload);
        showToast("success", language === "de" ? "Kunde erfolgreich aktualisiert." : "Customer updated successfully.");
      } else {
        await createCustomer(payload);
        showToast("success", language === "de" ? "Kunde erfolgreich angelegt." : "Customer created successfully.");
      }
      onSave();
    } catch (err) {
      logApiError("submit customer form", err);
      showToast("error", getFriendlyErrorMessage(err, "generic", t));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full my-8 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-900">
            {customerId ? loc.titleEdit : loc.titleCreate}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-primary" />
            <span className="mt-3 text-sm text-slate-500 font-medium">{loc.loading}</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Salutation, First Name, Last Name */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <div className="sm:col-span-1">
                <label className="label text-slate-700 text-xs font-semibold uppercase tracking-wider">
                  {loc.salutation}
                </label>
                <select
                  value={salutation}
                  onChange={(e) => setSalutation(e.target.value as any)}
                  className="input text-sm"
                >
                  <option value="">{loc.salutationPlaceholder}</option>
                  <option value="Mr">{loc.mr}</option>
                  <option value="Ms">{loc.ms}</option>
                  <option value="Diverse">{loc.diverse}</option>
                </select>
              </div>

              <div className="sm:col-span-1.5">
                <label className="label text-slate-700 text-xs font-semibold uppercase tracking-wider">
                  {loc.firstName} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={`input text-sm ${errors.firstName ? "border-red-500 focus:border-red-500" : ""}`}
                />
                {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
              </div>

              <div className="sm:col-span-1.5">
                <label className="label text-slate-700 text-xs font-semibold uppercase tracking-wider">
                  {loc.lastName} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={`input text-sm ${errors.lastName ? "border-red-500 focus:border-red-500" : ""}`}
                />
                {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
              </div>
            </div>

            {/* Company & VAT ID */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="label text-slate-700 text-xs font-semibold uppercase tracking-wider">
                  {loc.company}
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="input text-sm"
                />
              </div>

              <div>
                <label className="label text-slate-700 text-xs font-semibold uppercase tracking-wider">
                  {loc.vatId}
                </label>
                <input
                  type="text"
                  value={vatId}
                  onChange={(e) => setVatId(e.target.value)}
                  className="input text-sm"
                />
              </div>
            </div>

            {/* Address Info */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <div className="sm:col-span-2">
                <label className="label text-slate-700 text-xs font-semibold uppercase tracking-wider">
                  {loc.street} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  className={`input text-sm ${errors.street ? "border-red-500 focus:border-red-500" : ""}`}
                />
                {errors.street && <p className="text-red-500 text-xs mt-1">{errors.street}</p>}
              </div>

              <div className="sm:col-span-1">
                <label className="label text-slate-700 text-xs font-semibold uppercase tracking-wider">
                  {loc.zipCode} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  className={`input text-sm ${errors.zipCode ? "border-red-500 focus:border-red-500" : ""}`}
                />
                {errors.zipCode && <p className="text-red-500 text-xs mt-1">{errors.zipCode}</p>}
              </div>

              <div className="sm:col-span-1">
                <label className="label text-slate-700 text-xs font-semibold uppercase tracking-wider">
                  {loc.city} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className={`input text-sm ${errors.city ? "border-red-500 focus:border-red-500" : ""}`}
                />
                {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
              </div>
            </div>

            {/* Contact info: Phone & Email */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="label text-slate-700 text-xs font-semibold uppercase tracking-wider">
                  {loc.phone} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={`input text-sm ${errors.phone ? "border-red-500 focus:border-red-500" : ""}`}
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className="label text-slate-700 text-xs font-semibold uppercase tracking-wider">
                  {loc.email} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`input text-sm ${errors.email ? "border-red-500 focus:border-red-500" : ""}`}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
            </div>

            {/* Birthdate & Newsletter Checkbox */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="label text-slate-700 text-xs font-semibold uppercase tracking-wider">
                  {loc.dateOfBirth}
                </label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="input text-sm"
                />
              </div>

              <div className="flex items-center mt-6">
                <input
                  type="checkbox"
                  id="newsletter"
                  checked={newsletter}
                  onChange={(e) => setNewsletter(e.target.checked)}
                  className="h-4 w-4 text-primary border-slate-300 rounded focus:ring-primary"
                />
                <label htmlFor="newsletter" className="ml-2 text-sm text-slate-700 font-medium select-none">
                  {loc.newsletter}
                </label>
              </div>
            </div>

            {/* Notes Section */}
            <div>
              <label className="label text-slate-700 text-xs font-semibold uppercase tracking-wider">
                {loc.notes}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="input text-sm p-3 focus:ring-primary focus:border-primary resize-y"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="btn btn-outline h-11 px-5 text-sm font-semibold border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                {loc.cancel}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary h-11 px-5 text-sm font-semibold"
              >
                {saving ? loc.saving : loc.save}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
