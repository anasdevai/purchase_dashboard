import { FileText, Plus, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../i18n/LanguageProvider'

export function QuickActionsCard() {
  const { t } = useLanguage()

  return (
    <div className="card">
      <div className="card-header">
        <div className="text-sm font-semibold text-slate-900">
          {t.dashboard.quickActions}
        </div>
      </div>

      <div className="space-y-3 p-5">
        <Link to="/contracts/new" className="btn btn-primary w-full">
          <Plus className="h-4 w-4" />
          {t.dashboard.newContractBtn}
        </Link>

        <Link to="/contracts/search" className="btn btn-secondary w-full">
          <Search className="h-4 w-4 text-slate-600" />
          {t.dashboard.searchContractsBtn}
        </Link>

        <Link to="/contracts" className="btn btn-secondary w-full">
          <FileText className="h-4 w-4 text-slate-600" />
          {t.dashboard.allContractsBtn}
        </Link>
      </div>
    </div>
  )
}
