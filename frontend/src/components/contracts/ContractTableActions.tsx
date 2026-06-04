import { Download, Eye, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { downloadPdf } from '../../api/contracts'
import { useLanguage } from '../../i18n/LanguageProvider'
import type { ContractStatus } from '../../types/contract'

const iconActionClass =
  'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:bg-slate-50'

const iconDeleteClass =
  'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-red-600 transition hover:border-red-200 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60'

type ContractTableActionsProps = {
  contractId: string
  contractNumber: string
  status: ContractStatus
  pdfPath?: string | null
  onDelete: () => void
  deleteDisabled?: boolean
}

export function ContractTableActions({
  contractId,
  contractNumber,
  status,
  pdfPath,
  onDelete,
  deleteDisabled,
}: ContractTableActionsProps) {
  const { t } = useLanguage()
  const viewLabel = status === 'draft' ? t.table.continue : t.table.view

  return (
    <div className="flex flex-nowrap items-center justify-end gap-2">
      <Link
        to={`/contracts/${contractId}`}
        className={iconActionClass}
        aria-label={viewLabel}
        title={viewLabel}
      >
        <Eye className="h-4 w-4" aria-hidden />
      </Link>
      {pdfPath ? (
        <button
          type="button"
          onClick={() => downloadPdf(contractId, `${contractNumber}.pdf`)}
          className={iconActionClass}
          aria-label={t.table.download}
          title={t.table.download}
        >
          <Download className="h-4 w-4" aria-hidden />
        </button>
      ) : null}
      <button
        type="button"
        disabled={deleteDisabled}
        onClick={onDelete}
        className={iconDeleteClass}
        aria-label={t.table.delete}
        title={t.table.delete}
      >
        <Trash2 className="h-4 w-4" aria-hidden />
      </button>
    </div>
  )
}
