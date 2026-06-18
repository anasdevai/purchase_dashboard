// Original path: frontend/src/components/contract/ContractWizard.tsx
// Extracted: QR signature method state, polling, generation, and UI (step 4)

// --- State (lines ~221-224) ---
const [signatureMethod, setSignatureMethod] = useState<'onsite' | 'qr'>('onsite')
const [qrToken, setQrToken] = useState<string | null>(props.initialContract?.signatureToken ?? null)
const [qrStatus, setQrStatus] = useState<string | null>(props.initialContract?.signatureStatus ?? null)
const [qrUrl, setQrUrl] = useState<string | null>(props.initialContract?.qrUrl ?? null)

// --- Polling effect (lines ~226-251) ---
useEffect(() => {
  if (signatureMethod !== 'qr' || !draftId || qrStatus === 'SIGNED') return

  let active = true
  const interval = setInterval(async () => {
    try {
      const res = await fetchSignatureStatus(draftId)
      if (!active) return

      if (res.status === 'SIGNED') {
        setQrStatus('SIGNED')
        showToast('success', w.qrSignatureStatusSigned)
        clearInterval(interval)
      } else {
        setQrStatus(res.status)
      }
    } catch (err) {
      console.error('Error polling signature status:', err)
    }
  }, 2000)

  return () => {
    active = false
    clearInterval(interval)
  }
}, [signatureMethod, draftId, qrStatus, w.qrSignatureStatusSigned, showToast])

// --- Signature validation (lines ~353-357) ---
const hasCustomerSignature =
  Boolean(props.initialContract?.signaturePath) ||
  Boolean(customerSignatureDataUrl) ||
  Boolean(getLiveSignatureDataUrl(customerSigRef.current)) ||
  (signatureMethod === 'qr' && qrStatus === 'SIGNED')

// --- Generate QR handler (lines ~441-459) ---
const handleGenerateQr = async () => {
  setError(null)
  setMessage(null)
  setIsSubmitting(true)
  try {
    const draft = await persistDraft(getValues())
    await uploadSelectedFiles(draft.id)

    const res = await generateSignatureQr(draft.id)
    setQrToken(res.token)
    setQrStatus(res.status)
    setQrUrl(res.qrUrl ?? null)
    showToast('success', t.common.toasts.contractDraftSaved)
  } catch (err) {
    logApiError('generate QR signature token', err)
    setError(getFriendlyErrorMessage(err, 'contractSave', t))
  } finally {
    setIsSubmitting(false)
  }
}

// --- QR UI in signature step (lines ~1000-1108) ---
// Signature method tabs: onsite vs QR
// QR display uses external API (no npm QR package):
//   https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrUrl || origin/signature/token)}
// Shows QR image, link preview, status badge (waiting/signed), and "Generate QR Code" button

// Imports used by this feature:
// generateSignatureQr, fetchSignatureStatus from '../../api/contracts'
