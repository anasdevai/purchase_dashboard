import { useEffect, useState } from 'react'
import { Pencil, Plus, Save, Trash2, X } from 'lucide-react'
import {
  createRepairCompany,
  deleteRepairCompany,
  fetchRepairCompanies,
  updateRepairCompany,
} from '../../api/repairCompanies'
import { useAppConfirm } from '../common/ConfirmDialogProvider'
import { useLanguage } from '../../i18n/LanguageProvider'
import { getFriendlyErrorMessage, logApiError } from '../../utils/apiErrors'
import type { RepairCompany, RepairCompanyPayload } from '../../types/repairCompany'

type CompanyForm = RepairCompanyPayload & { id?: string }

const emptyForm = (): CompanyForm => ({
  name: '',
  contactInfo: '',
  notes: '',
})

export function RepairCompaniesCard() {
  const { t, interpolate } = useLanguage()
  const { showToast, confirm } = useAppConfirm()
  const [companies, setCompanies] = useState<RepairCompany[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [form, setForm] = useState<CompanyForm>(emptyForm())
  const [editingId, setEditingId] = useState<string | null>(null)

  const loadCompanies = () => {
    setLoading(true)
    fetchRepairCompanies()
      .then((data) => setCompanies(data))
      .catch((err) => {
        logApiError('repair companies load', err)
        showToast('error', getFriendlyErrorMessage(err, 'load', t))
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadCompanies()
  }, [])

  const resetForm = () => {
    setForm(emptyForm())
    setEditingId(null)
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      showToast('error', t.settings.repairCompanies.errors.nameRequired)
      return
    }

    setSaving(true)
    try {
      const payload: RepairCompanyPayload = {
        name: form.name.trim(),
        contactInfo: form.contactInfo?.trim() || undefined,
        notes: form.notes?.trim() || undefined,
      }

      if (editingId) {
        const updated = await updateRepairCompany(editingId, payload)
        setCompanies((current) =>
          current.map((company) => (company.id === updated.id ? updated : company)),
        )
      } else {
        const created = await createRepairCompany(payload)
        setCompanies((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name)))
      }

      showToast('success', t.settings.repairCompanies.savedSuccess)
      resetForm()
    } catch (err) {
      logApiError('repair company save', err)
      showToast('error', getFriendlyErrorMessage(err, 'generic', t))
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (company: RepairCompany) => {
    setEditingId(company.id)
    setForm({
      id: company.id,
      name: company.name,
      contactInfo: company.contactInfo ?? '',
      notes: company.notes ?? '',
    })
  }

  const handleDelete = (company: RepairCompany) => confirm({title:t.common.confirm,message:interpolate(t.settings.repairCompanies.confirmDelete,{name:company.name}),variant:'danger',onConfirm:async()=>{
    setDeletingId(company.id)
    try {
      await deleteRepairCompany(company.id)
      setCompanies((current) => current.filter((item) => item.id !== company.id))
      if (editingId === company.id) resetForm()
      showToast('success', t.settings.repairCompanies.deletedSuccess)
    } catch (err) {
      logApiError('repair company delete', err)
      showToast('error', getFriendlyErrorMessage(err, 'generic', t))
    } finally {
      setDeletingId(null)
    }
  }})

  return (
    <section className="card overflow-hidden">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-sm font-semibold text-slate-900">{t.settings.repairCompanies.title}</h2>
        <p className="mt-1 text-xs text-slate-500">{t.settings.repairCompanies.description}</p>
      </div>

      <div className="space-y-5 px-5 py-5">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {editingId ? t.settings.repairCompanies.editCompany : t.settings.repairCompanies.addCompany}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="mb-1.5 block text-xs font-medium text-slate-600">
                {t.settings.repairCompanies.companyName}
              </span>
              <input
                className="input"
                data-testid="repair-company-name"
                placeholder={t.settings.repairCompanies.companyNamePlaceholder}
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              />
            </label>
            <label className="sm:col-span-2">
              <span className="mb-1.5 block text-xs font-medium text-slate-600">
                {t.settings.repairCompanies.contactInfo}
              </span>
              <input
                className="input"
                placeholder={t.settings.repairCompanies.contactInfoPlaceholder}
                value={form.contactInfo ?? ''}
                onChange={(event) =>
                  setForm((current) => ({ ...current, contactInfo: event.target.value }))
                }
              />
            </label>
            <label className="sm:col-span-2">
              <span className="mb-1.5 block text-xs font-medium text-slate-600">
                {t.settings.repairCompanies.companyNotes}
              </span>
              <textarea
                className="input min-h-20 py-2"
                placeholder={t.settings.repairCompanies.companyNotesPlaceholder}
                value={form.notes ?? ''}
                onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              />
            </label>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-primary h-10"
              disabled={saving}
              onClick={handleSubmit}
            >
              {editingId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {editingId ? t.settings.repairCompanies.saveCompany : t.settings.repairCompanies.addCompany}
            </button>
            {editingId ? (
              <button type="button" className="btn btn-secondary h-10" onClick={resetForm}>
                <X className="h-4 w-4" />
                {t.common.cancel}
              </button>
            ) : null}
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">{t.common.loading}</p>
        ) : companies.length === 0 ? (
          <p className="text-sm text-slate-500">{t.settings.repairCompanies.empty}</p>
        ) : (
          <div className="space-y-2">
            {companies.map((company) => (
              <div
                key={company.id}
                className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="font-semibold text-slate-900">{company.name}</div>
                  {company.contactInfo ? (
                    <div className="mt-1 text-sm text-slate-600">{company.contactInfo}</div>
                  ) : null}
                  {company.notes ? (
                    <div className="mt-1 text-sm text-slate-500">{company.notes}</div>
                  ) : null}
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    className="btn btn-secondary h-8 px-3"
                    onClick={() => startEdit(company)}
                  >
                    <Pencil className="h-4 w-4" />
                    {t.settings.repairCompanies.editCompany}
                  </button>
                  <button
                    type="button"
                    className="btn h-8 px-3 text-red-600 hover:bg-red-50"
                    disabled={deletingId === company.id}
                    onClick={() => handleDelete(company)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
