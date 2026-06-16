import { Link } from 'react-router-dom'
import { Building2, ExternalLink } from 'lucide-react'
import { FloatingSelect } from '../common/FloatingSelect'
import { useLanguage } from '../../i18n/LanguageProvider'
import type { RepairCompany } from '../../types/repairCompany'

export function RepairCompanyFields(props: {
  repairCompanyId?: string
  repairCompanyNotes?: string
  companies: RepairCompany[]
  loading?: boolean
  companyError?: string
  onRepairCompanyIdChange: (id: string) => void
  onNotesChange: (notes: string) => void
}) {
  const { t } = useLanguage()
  const selectedCompany = props.companies.find((company) => company.id === props.repairCompanyId)

  return (
    <section className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 sm:p-5">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white text-indigo-600 shadow-sm ring-1 ring-indigo-100">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              {t.repairOrders.detail.externalRepairCompany}
            </h3>
            <p className="mt-0.5 text-sm text-slate-600">
              {t.repairOrders.detail.externalRepairCompanyHint}
            </p>
          </div>
        </div>
        <Link
          to="/settings"
          className="btn btn-secondary h-9 shrink-0 bg-white px-3 text-xs sm:text-sm"
        >
          <ExternalLink className="h-4 w-4" />
          {t.repairOrders.detail.manageRepairCompanies}
        </Link>
      </div>

      <div className="grid gap-4">
        <label>
          <span className="label">{t.repairOrders.detail.repairCompany}</span>
          <FloatingSelect
            testId="repair-order-company"
            disabled={props.loading}
            value={props.repairCompanyId ?? ''}
            placeholder={t.repairOrders.detail.selectRepairCompany}
            options={[
              { value: '', label: t.repairOrders.detail.selectRepairCompany },
              ...props.companies.map((company) => ({
                value: company.id,
                label: company.name,
              })),
            ]}
            onChange={props.onRepairCompanyIdChange}
          />
          {props.companyError ? (
            <p className="mt-1 text-xs font-medium text-red-600">{props.companyError}</p>
          ) : null}
          {!props.loading && props.companies.length === 0 ? (
            <p className="mt-1 text-xs text-slate-500">{t.repairOrders.detail.noRepairCompanies}</p>
          ) : null}
        </label>

        {selectedCompany ? (
          <div className="rounded-lg border border-white bg-white/80 px-4 py-3 text-sm text-slate-700">
            <div className="font-semibold text-slate-900">{selectedCompany.name}</div>
            {selectedCompany.contactInfo ? (
              <div className="mt-1 text-slate-600">{selectedCompany.contactInfo}</div>
            ) : null}
            {selectedCompany.notes ? (
              <div className="mt-2 text-slate-500">{selectedCompany.notes}</div>
            ) : null}
          </div>
        ) : null}

        <label>
          <span className="label">{t.repairOrders.detail.repairCompanyNotes}</span>
          <textarea
            data-testid="repair-order-company-notes"
            className="min-h-24 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary-light"
            placeholder={t.repairOrders.detail.repairCompanyNotesPlaceholder}
            value={props.repairCompanyNotes ?? ''}
            onChange={(event) => props.onNotesChange(event.target.value)}
          />
        </label>
      </div>
    </section>
  )
}
