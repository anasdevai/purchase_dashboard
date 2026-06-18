import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import SignatureCanvas from 'react-signature-canvas'
import { fetchSignatureContract, submitSignatureByToken } from '../api/contracts'
import { LanguageSwitcher } from '../components/common/LanguageSwitcher'
import { useLanguage } from '../i18n/LanguageProvider'
import type { ApiContract } from '../types/contract'
import { logApiError, ApiError } from '../utils/apiErrors'

const SCLERA_LOGO = '/Sclera%20logo.png'

function dataUrlToBlob(dataUrl: string) {
  const [meta, content] = dataUrl.split(',')
  const mime = meta.match(/data:(.*);base64/)?.[1] ?? 'image/png'
  const bytes = atob(content)
  const buffer = new Uint8Array(bytes.length)
  for (let index = 0; index < bytes.length; index += 1) {
    buffer[index] = bytes.charCodeAt(index)
  }
  return new Blob([buffer], { type: mime })
}

function trimCanvas(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas

  const width = canvas.width
  const height = canvas.height
  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data

  let minX = width
  let minY = height
  let maxX = 0
  let maxY = 0

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[4 * (y * width + x) + 3]
      if (alpha > 0) {
        if (x < minX) minX = x
        if (y < minY) minY = y
        if (x > maxX) maxX = x
        if (y > maxY) maxY = y
      }
    }
  }

  if (maxX < minX || maxY < minY) {
    return canvas
  }

  const trimmedWidth = maxX - minX + 1
  const trimmedHeight = maxY - minY + 1
  const trimmedData = ctx.getImageData(minX, minY, trimmedWidth, trimmedHeight)

  const copy = document.createElement('canvas')
  copy.width = trimmedWidth
  copy.height = trimmedHeight
  const copyCtx = copy.getContext('2d')
  if (copyCtx) {
    copyCtx.putImageData(trimmedData, 0, 0)
  }

  return copy
}

export function MobileSignaturePage() {
  const { token } = useParams<{ token: string }>()
  const { t, formatMoney } = useLanguage()
  const sigRef = useRef<SignatureCanvas | null>(null)
  
  const [contract, setContract] = useState<ApiContract | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)

  useEffect(() => {
    if (!token) return
    
    setIsLoading(true)
    setError(null)
    fetchSignatureContract(token)
      .then((data) => {
        setContract(data)
      })
      .catch((err) => {
        logApiError('fetch signature contract', err)
        setError(t.common.errors.contractFailed)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [token, t])

  const handleClear = () => {
    sigRef.current?.clear()
    setHasSignature(false)
  }

  const handleSubmit = async () => {
    if (!token || !sigRef.current || sigRef.current.isEmpty()) return

    setIsSubmitting(true)
    setError(null)
    try {
      const canvas = sigRef.current.getCanvas()
      const trimmedCanvas = trimCanvas(canvas)
      const dataUrl = trimmedCanvas.toDataURL('image/png')
      const blob = dataUrlToBlob(dataUrl)
      await submitSignatureByToken(token, blob)
      setSuccess(true)
    } catch (err: any) {
      logApiError('submit signature by token', err)
      const friendlyMsg = err instanceof ApiError 
        ? (err.rawMessage || err.message) 
        : (err instanceof Error ? `${err.name}: ${err.message}` : String(err));
      setError(friendlyMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-4 text-sm font-medium text-slate-600">{t.common.loading}</p>
        </div>
      </div>
    )
  }

  if (error && !contract) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-[480px] rounded-2xl bg-white p-6 shadow-md ring-1 ring-slate-200 text-center">
          <div className="text-red-500 text-4xl mb-3">⚠️</div>
          <h1 className="text-lg font-bold text-slate-900 mb-2">{t.common.somethingWentWrong}</h1>
          <p className="text-sm text-slate-500 mb-4">{error}</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-[480px] rounded-2xl bg-white p-8 shadow-lg ring-1 ring-slate-200 text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-3xl">
            ✓
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            {t.language.label === 'de' ? 'Unterschrift erfolgreich gesendet' : 'Signature Submitted Successfully'}
          </h1>
          <p className="text-sm text-slate-500">
            {t.language.label === 'de' 
              ? 'Vielen Dank! Ihre Unterschrift wurde erfolgreich an das System übertragen. Sie können dieses Fenster nun schließen.' 
              : 'Thank you! Your signature has been transferred to the system. You can close this window now.'}
          </p>
        </div>
      </div>
    )
  }

  const deviceName = [contract?.brand, contract?.model].filter(Boolean).join(' ') || t.common.dash

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <div className="flex shrink-0 items-center justify-between bg-white border-b border-slate-200 px-4 py-3">
        <img src={SCLERA_LOGO} alt="Sclera Logo" className="h-6 w-auto" />
        <LanguageSwitcher />
      </div>

      <main className="flex-1 p-4 md:p-6 flex flex-col items-center justify-start overflow-auto">
        <div className="w-full max-w-[480px] bg-white rounded-2xl shadow-md ring-1 ring-slate-200/60 overflow-hidden flex flex-col">
          {/* Header information */}
          <div className="bg-primary text-white p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-white/70">
              {t.language.label === 'de' ? 'Kaufvertrag Unterschrift' : 'Purchase Contract Signature'}
            </h2>
            <h1 className="text-lg font-bold mt-1">
              {contract?.contractNumber}
            </h1>
          </div>

          <div className="p-5 flex-1 flex flex-col space-y-5">
            {/* Summary details */}
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">{t.contractWizard.review.name}</span>
                <span className="font-semibold text-slate-800">
                  {[contract?.customerFirstName, contract?.customerLastName].filter(Boolean).join(' ') || contract?.customerName || t.common.dash}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t.contractWizard.review.device}</span>
                <span className="font-semibold text-slate-800">{deviceName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t.contractWizard.review.price}</span>
                <span className="font-bold text-slate-900">
                  {contract?.purchasePrice ? formatMoney(Number(contract.purchasePrice)) : t.common.dash}
                </span>
              </div>
            </div>

            {/* Signature Drawing Area */}
            <div>
              <label className="label text-slate-800 font-semibold mb-2 block">
                {t.contractWizard.customerSignatureTitle}
              </label>
              
              <div className="rounded-xl border border-slate-200 bg-slate-100 overflow-hidden">
                <div className="h-[200px] bg-white">
                  <SignatureCanvas
                    ref={(ref) => {
                      sigRef.current = ref
                    }}
                    onEnd={() => setHasSignature(true)}
                    canvasProps={{
                      className: 'h-[200px] w-full',
                    }}
                  />
                </div>
                <div className="flex justify-between border-t border-slate-200 px-3 py-2 bg-slate-50">
                  <span className="text-xs text-slate-400 self-center">
                    {t.language.label === 'de' ? 'Bitte im weißen Bereich unterschreiben' : 'Please sign in the white area'}
                  </span>
                  <button type="button" className="btn btn-ghost h-8 px-3 text-xs" onClick={handleClear}>
                    {t.contractWizard.clear}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 ring-1 ring-red-100">
                {error}
              </div>
            )}

            {/* Submission buttons */}
            <button
              type="button"
              disabled={isSubmitting || !hasSignature}
              onClick={handleSubmit}
              className="btn btn-primary w-full h-12 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? t.common.pleaseWait : (t.language.label === 'de' ? 'Unterschrift übermitteln' : 'Submit Signature')}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
