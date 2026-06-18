import { useRef, useState } from 'react'
import { Camera, Loader2 } from 'lucide-react'
import { scanRepairOrderForm, type RepairOrderOcrResult } from '../../api/ocr'
import { useLanguage } from '../../i18n/LanguageProvider'
import { getFriendlyErrorMessage, logApiError } from '../../utils/apiErrors'

type Props = {
  disabled?: boolean
  onApply: (result: RepairOrderOcrResult) => void
  onError?: (message: string) => void
}

export function RepairOrderOcrScan({ disabled, onApply, onError }: Props) {
  const { t } = useLanguage()
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [lastResult, setLastResult] = useState<RepairOrderOcrResult | null>(null)

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setLoading(true)
    setLastResult(null)

    try {
      const result = await scanRepairOrderForm(file)
      setLastResult(result)
      onApply(result)
    } catch (err) {
      logApiError('repair order ocr scan', err)
      const message = getFriendlyErrorMessage(err, 'generic', t)
      onError?.(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.pdf,.doc,.docx"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      <button
        type="button"
        data-testid="repair-order-ocr-scan"
        className="btn btn-secondary w-full sm:w-auto"
        disabled={disabled || loading}
        onClick={() => inputRef.current?.click()}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
        {loading ? t.repairOrders.detail.ocrScanning : t.repairOrders.detail.ocrScanButton}
      </button>

      {lastResult ? (
        <div className="rounded-lg border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-slate-700">
          <p className="font-semibold text-slate-900">
            {t.repairOrders.detail.ocrConfidence.replace(
              '{confidence}',
              String(Math.round(lastResult.confidence)),
            )}
          </p>
          {lastResult.unclearFields.length > 0 ? (
            <p className="mt-1 text-amber-800">
              {t.repairOrders.detail.ocrUnclearFields}: {lastResult.unclearFields.join(', ')}
            </p>
          ) : (
            <p className="mt-1 text-slate-600">{t.repairOrders.detail.ocrAppliedHint}</p>
          )}
        </div>
      ) : null}
    </div>
  )
}
