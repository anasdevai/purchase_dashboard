import { useEffect, useState } from 'react'
import { Download, Mail, Printer, Trash2 } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  cancelContract,
  downloadPdf,
  emailContractPdf,
  fetchContract,
  fetchPdfBlob,
  mapContract,
} from '../api/contracts'
import { ContractWizard } from '../components/contract/ContractWizard'
import { StatusBadge } from '../components/contract/StatusBadge'
import { useAuth } from '../auth/AuthContext'
import { useAppConfirm } from '../components/common/ConfirmDialogProvider'
import { useDeleteContractConfirm } from '../hooks/useDeleteContractConfirm'
import { useLanguage } from '../i18n/LanguageProvider'
import { getFriendlyErrorMessage, logApiError } from '../utils/apiErrors'
import type { ApiContract } from '../types/contract'

export function ContractDetailPage() {
  const { contractId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t, formatMoney, formatDate, interpolate } = useLanguage()
  const { showToast, confirm } = useAppConfirm()
  const [apiContract, setApiContract] = useState<ApiContract | null>(null)
  const [pdfObjectUrl, setPdfObjectUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const { askDeleteContract } = useDeleteContractConfirm()

  useEffect(() => {
    if (!contractId || !user?.id) return
    let alive = true
    setApiContract(null)
    setError(null)
    fetchContract(contractId)
      .then((contract) => {
        if (alive) setApiContract(contract)
      })
      .catch((err) => {
        logApiError('contract detail load', err)
        if (alive) setError(getFriendlyErrorMessage(err, 'load', t))
      })

    return () => {
      alive = false
    }
  }, [contractId, user?.id])

  useEffect(() => {
    if (!apiContract?.pdfPath) {
      setPdfObjectUrl(null)
      return
    }

    let objectUrl: string | null = null
    let alive = true
    fetchPdfBlob(apiContract.id)
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob)
        if (alive) setPdfObjectUrl(objectUrl)
      })
      .catch((err) => {
        logApiError('contract pdf preview', err)
        if (alive) showToast('error', getFriendlyErrorMessage(err, 'pdfDownload', t))
      })

    return () => {
      alive = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [apiContract])

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-100">
        {error}
      </div>
    )
  }

  if (!apiContract) {
    return <div className="text-sm font-semibold text-slate-600">{t.contractDetail.loading}</div>
  }

  const contract = mapContract(apiContract)

  const handleSendEmail = () => {
    if (!apiContract?.customerEmail) {
      showToast('error', t.contractDetail.emailSendFailed)
      return
    }

    confirm({
      title: t.contractDetail.sendEmailConfirmTitle,
      message: interpolate(t.contractDetail.sendEmailConfirmMessage, {
        email: apiContract.customerEmail,
      }),
      onConfirm: async () => {
        setSendingEmail(true)
        try {
          await emailContractPdf(apiContract.id)
          showToast('success', t.contractDetail.emailSentSuccess)
        } catch (err) {
          logApiError('contract email send', err)
          showToast('error', getFriendlyErrorMessage(err, 'generic', t))
        } finally {
          setSendingEmail(false)
        }
      },
    })
  }

  const handleCancelDelete = () => {
    askDeleteContract(
      apiContract.contractNumber,
      async () => {
        await cancelContract(apiContract.id)
      },
      () => navigate('/contracts'),
    )
  }

  if (apiContract.status === 'Draft') {
    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="text-lg font-semibold text-slate-900">
              {interpolate(t.contractDetail.continueDraft, {
                contractNumber: contract.contractNumber,
              })}
            </div>
            <div className="mt-1 text-sm text-slate-600">{t.contractDetail.continueDraftHint}</div>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <button
              type="button"
              onClick={handleCancelDelete}
              className="btn w-full bg-red-600 text-white hover:bg-red-700 sm:w-auto"
            >
              <Trash2 className="h-4 w-4" />
              {t.contractDetail.cancelDelete}
            </button>
            <Link to="/contracts" className="btn btn-secondary w-full sm:w-auto">
              {t.contractDetail.backToContracts}
            </Link>
          </div>
        </div>

        <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 ring-1 ring-amber-100">
          {t.contractDetail.draftBanner}
        </div>

        <ContractWizard
          initialContract={apiContract}
          onCompleted={(completed) => {
            setError(null)
            setApiContract(completed)
          }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="text-lg font-semibold text-slate-900">
            {t.contractDetail.contract} {contract.contractNumber}
          </div>
          <div className="mt-1 truncate text-sm text-slate-600 sm:whitespace-normal">
            {contract.customerName} - {contract.device} - {formatDate(contract.dateISO)}
          </div>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <button
            type="button"
            onClick={() => window.print()}
            className="btn btn-secondary w-full sm:w-auto"
          >
            <Printer className="h-4 w-4" />
            {t.contractDetail.print}
          </button>
          <button
            type="button"
            onClick={handleCancelDelete}
            className="btn w-full bg-red-600 text-white hover:bg-red-700 sm:w-auto"
          >
            <Trash2 className="h-4 w-4" />
            {t.contractDetail.cancelDelete}
          </button>
          {apiContract.pdfPath ? (
            <button
              type="button"
              data-testid="contract-detail-download-pdf"
              disabled={downloadingPdf}
              onClick={async () => {
                setDownloadingPdf(true)
                try {
                  await downloadPdf(apiContract.id, `${apiContract.contractNumber}.pdf`)
                  showToast('success', t.common.toasts.contractPdfDownloaded)
                } catch (err) {
                  logApiError('contract pdf download', err)
                  showToast('error', getFriendlyErrorMessage(err, 'pdfDownload', t))
                } finally {
                  setDownloadingPdf(false)
                }
              }}
              className="btn btn-primary w-full sm:w-auto"
            >
              <Download className="h-4 w-4" />
              {t.contractDetail.downloadPdf}
            </button>
          ) : null}
          {apiContract.pdfPath && apiContract.customerEmail ? (
            <button
              type="button"
              data-testid="contract-send-email"
              disabled={sendingEmail}
              onClick={handleSendEmail}
              className="btn btn-secondary w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Mail className="h-4 w-4" />
              {sendingEmail ? t.common.pleaseWait : t.contractDetail.sendEmailBtn}
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-4">
          <div className="card min-w-0 overflow-hidden" data-testid="contract-detail-info">
            <div className="card-header">
              <div className="text-sm font-semibold text-slate-900">
                {t.contractDetail.details}
              </div>
              <StatusBadge status={contract.status} />
            </div>
            <div className="card-body space-y-3 text-sm">
              {[
                [t.table.contractNumber, contract.contractNumber],
                [t.table.customer, apiContract.customerName || t.common.dash],
                [t.table.phone, apiContract.customerPhone || t.common.dash],
                [t.table.address, apiContract.customerAddress || t.common.dash],
                [t.table.device, contract.device],
                [t.table.imeiSerial, contract.imeiOrSerial],
                [
                  t.table.condition,
                  apiContract.condition
                    ? t.contractWizard.options[
                        apiContract.condition as keyof typeof t.contractWizard.options
                      ] ?? apiContract.condition
                    : t.common.dash,
                ],
                [
                  t.table.payment,
                  apiContract.paymentMethod
                    ? t.contractWizard.options[
                        apiContract.paymentMethod as keyof typeof t.contractWizard.options
                      ] ?? apiContract.paymentMethod
                    : t.common.dash,
                ],
                [t.table.price, formatMoney(contract.price)],
                [t.table.date, formatDate(contract.dateISO)],
              ].map(([label, value]) => (
                <div key={label} className="flex items-start justify-between gap-3">
                  <div className="text-slate-500">{label}</div>
                  <div className="max-w-[60%] text-right font-semibold text-slate-900">
                    {value}
                  </div>
                </div>
              ))}

              <div className="pt-2">
                <Link
                  to="/contracts"
                  className="text-sm font-semibold text-primary hover:text-primary-hover"
                >
                  {t.contractDetail.backToContracts}
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="min-w-0 lg:col-span-8">
          <div className="card min-w-0 overflow-hidden">
            <div className="card-header">
              <div className="text-sm font-semibold text-slate-900">
                {t.contractDetail.pdfPreview}
              </div>
              {pdfObjectUrl ? (
                <a href={pdfObjectUrl} target="_blank" rel="noreferrer" className="text-xs font-semibold text-primary hover:text-primary-hover">
                  {t.contractDetail.openPdf}
                </a>
              ) : null}
            </div>
            <div className="p-5">
              {apiContract.pdfPath && pdfObjectUrl ? (
                <iframe
                  title={t.contractDetail.pdfIframeTitle}
                  src={pdfObjectUrl}
                  className="h-[720px] w-full rounded-lg border border-slate-200 bg-white"
                />
              ) : (
                <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                  {t.contractDetail.pdfPending}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
