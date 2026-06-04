import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { cancelContract, fetchContracts, mapContract } from '../api/contracts'
import { ContractTableActions } from '../components/contracts/ContractTableActions'
import {
  contractTableActionCellClass,
  contractTableActionHeaderClass,
  contractTableMinWidthClass,
} from '../components/contracts/contractTableLayout'
import { StatusBadge } from '../components/contract/StatusBadge'
import type { Contract } from '../types/contract'
import { useAuth } from '../auth/AuthContext'
import { useDeleteContractConfirm } from '../hooks/useDeleteContractConfirm'
import { useLanguage } from '../i18n/LanguageProvider'

export function ContractsPage() {
  const { user } = useAuth()
  const { t, formatMoney, formatDate } = useLanguage()
  const [contracts, setContracts] = useState<Contract[]>([])
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { askDeleteContract } = useDeleteContractConfirm()

  useEffect(() => {
    if (!user?.id) return
    let alive = true
    setContracts([])
    setError(null)
    fetchContracts()
      .then((data) => {
        if (alive) setContracts(data.map(mapContract))
      })
      .catch((err) => {
        if (alive) setError(err instanceof Error ? err.message : 'Contracts failed to load')
      })

    return () => {
      alive = false
    }
  }, [user?.id])

  const handleCancelDelete = (contract: Contract) => {
    askDeleteContract(contract.contractNumber, async () => {
      setDeletingId(contract.id)
      setError(null)
      try {
        await cancelContract(contract.id)
        setContracts((current) => current.filter((item) => item.id !== contract.id))
      } finally {
        setDeletingId(null)
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-lg font-semibold text-slate-900">
          {t.contractsPage.title}
        </div>
        <Link to="/contracts/new" className="btn btn-primary w-full sm:w-auto">
          {t.contractsPage.newContract}
        </Link>
      </div>

      {error ? (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-100">
          {error}
        </div>
      ) : null}

      <div className="card min-w-0 overflow-hidden">
        <div className="card-body">
          <div className="text-sm font-semibold text-slate-900">
            {t.table.allContracts}
          </div>
          <div className="table-scroll mt-4">
            <table className={`w-full ${contractTableMinWidthClass}`}>
              <thead>
                <tr className="text-left text-xs font-semibold text-slate-500">
                  <th className="w-12 whitespace-nowrap py-2 pr-4">{t.table.serialNo}</th>
                  <th className="whitespace-nowrap py-2 pr-4">{t.table.contractNumber}</th>
                  <th className="whitespace-nowrap py-2 pr-4">{t.table.customer}</th>
                  <th className="whitespace-nowrap py-2 pr-4">{t.table.device}</th>
                  <th className="whitespace-nowrap py-2 pr-4">{t.table.imeiSerial}</th>
                  <th className="whitespace-nowrap py-2 pr-4">{t.table.price}</th>
                  <th className="whitespace-nowrap py-2 pr-4">{t.table.date}</th>
                  <th className="whitespace-nowrap py-2 pr-4">{t.table.status}</th>
                  <th className={`py-2 pr-4 ${contractTableActionHeaderClass}`}>{t.table.action}</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {contracts.map((c, index) => (
                  <tr key={c.id} className="border-t border-slate-200">
                    <td className="whitespace-nowrap py-3 pr-4 text-slate-600">{index + 1}</td>
                    <td className="whitespace-nowrap py-3 pr-4">{c.contractNumber}</td>
                    <td className="py-3 pr-4">{c.customerName}</td>
                    <td className="py-3 pr-4">{c.device}</td>
                    <td className="whitespace-nowrap py-3 pr-4">{c.imeiOrSerial}</td>
                    <td className="whitespace-nowrap py-3 pr-4">{formatMoney(c.price)}</td>
                    <td className="whitespace-nowrap py-3 pr-4">{formatDate(c.dateISO)}</td>
                    <td className="whitespace-nowrap py-3 pr-4">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className={`py-3 pr-4 ${contractTableActionCellClass}`}>
                      <ContractTableActions
                        contractId={c.id}
                        contractNumber={c.contractNumber}
                        status={c.status}
                        pdfPath={c.pdfPath}
                        deleteDisabled={deletingId === c.id}
                        onDelete={() => handleCancelDelete(c)}
                      />
                    </td>
                  </tr>
                ))}
                {contracts.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-sm text-slate-500">
                      {t.table.noResults}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
