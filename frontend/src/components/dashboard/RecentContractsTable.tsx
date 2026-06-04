import { useState } from 'react'
import { Link } from 'react-router-dom'
import { cancelContract, mapContract } from '../../api/contracts'
import { ContractTableActions } from '../contracts/ContractTableActions'
import {
  contractTableActionCellClass,
  contractTableActionHeaderClass,
  contractTableMinWidthClass,
} from '../contracts/contractTableLayout'
import { useDeleteContractConfirm } from '../../hooks/useDeleteContractConfirm'
import { useLanguage } from '../../i18n/LanguageProvider'
import type { ApiContract } from '../../types/contract'
import { StatusBadge } from '../contract/StatusBadge'

export function RecentContractsTable(props: { contracts: ApiContract[]; onDeleted?: () => void }) {
  const { t, formatMoney, formatDate } = useLanguage()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { askDeleteContract } = useDeleteContractConfirm()
  const contracts = props.contracts.map(mapContract)

  const handleCancelDelete = (contractId: string, contractNumber: string) => {
    askDeleteContract(contractNumber, async () => {
      setDeletingId(contractId)
      try {
        await cancelContract(contractId)
        props.onDeleted?.()
      } finally {
        setDeletingId(null)
      }
    })
  }

  return (
    <div className="card min-w-0 overflow-hidden">
      <div className="card-header">
        <div className="text-sm font-semibold text-slate-900">
          {t.dashboard.recentContracts}
        </div>
        <Link
          to="/contracts"
          className="text-xs font-semibold text-primary hover:text-primary-hover"
        >
          {t.dashboard.viewAll}
        </Link>
      </div>

      <div className="table-scroll">
        <table className={`w-full ${contractTableMinWidthClass} border-separate border-spacing-0`}>
          <thead>
            <tr className="text-left text-xs font-semibold text-slate-500">
              <th className="w-12 whitespace-nowrap px-3 py-3 sm:px-5">{t.table.serialNo}</th>
              <th className="whitespace-nowrap px-5 py-3">{t.table.contractNumber}</th>
              <th className="whitespace-nowrap px-5 py-3">{t.table.customerName}</th>
              <th className="whitespace-nowrap px-5 py-3">{t.table.device}</th>
              <th className="whitespace-nowrap px-5 py-3">{t.table.imeiSerial}</th>
              <th className="whitespace-nowrap px-5 py-3">{t.table.price}</th>
              <th className="whitespace-nowrap px-5 py-3">{t.table.date}</th>
              <th className="whitespace-nowrap px-5 py-3">{t.table.status}</th>
              <th className={`px-5 py-3 ${contractTableActionHeaderClass}`}>{t.table.action}</th>
            </tr>
          </thead>
          <tbody className="text-sm text-slate-700">
            {contracts.map((c, index) => (
              <tr key={c.id} className="border-t border-slate-200">
                <td className="whitespace-nowrap px-5 py-3 text-slate-600">{index + 1}</td>
                <td className="whitespace-nowrap px-5 py-3">{c.contractNumber}</td>
                <td className="px-5 py-3">{c.customerName}</td>
                <td className="px-5 py-3">{c.device}</td>
                <td className="whitespace-nowrap px-5 py-3">{c.imeiOrSerial}</td>
                <td className="whitespace-nowrap px-5 py-3">{formatMoney(c.price)}</td>
                <td className="whitespace-nowrap px-5 py-3">{formatDate(c.dateISO)}</td>
                <td className="whitespace-nowrap px-5 py-3">
                  <StatusBadge status={c.status} />
                </td>
                <td className={`px-5 ${contractTableActionCellClass}`}>
                  <ContractTableActions
                    contractId={c.id}
                    contractNumber={c.contractNumber}
                    status={c.status}
                    pdfPath={c.pdfPath}
                    deleteDisabled={deletingId === c.id}
                    onDelete={() => handleCancelDelete(c.id, c.contractNumber)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
