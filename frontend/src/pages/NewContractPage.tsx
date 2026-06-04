import { ContractWizard } from '../components/contract/ContractWizard'
import { useLanguage } from '../i18n/LanguageProvider'

export function NewContractPage() {
  const { t } = useLanguage()

  return (
    <div className="space-y-6">
      <div className="text-lg font-semibold text-slate-900">{t.pages.newContract}</div>
      <ContractWizard defaultStep={0} />
    </div>
  )
}
