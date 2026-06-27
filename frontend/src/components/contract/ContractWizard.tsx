import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useForm, type UseFormRegisterReturn } from 'react-hook-form'
import SignatureCanvas from 'react-signature-canvas'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import {
  contractToDraftPayload,
  completeContract,
  createDraft,
  fetchContract,
  fetchSignatureStatus,
  generateSignatureQr,
  updateDraft,
  uploadContractFile,
  uploadSignature,
  validateDeviceIdentifiers,
  type ContractDraftPayload,
} from '../../api/contracts'
import { useAppConfirm } from '../common/ConfirmDialogProvider'
import { FormActionFooter } from '../common/FormActionFooter'
import { useLanguage } from '../../i18n/LanguageProvider'
import {
  getFriendlyErrorMessage,
  isDraftAlreadyCompletedError,
  logApiError,
  ApiError,
} from '../../utils/apiErrors'
import type { OptionLabels } from '../../i18n/types'
import { useAuth } from '../../auth/AuthContext'
import { loadShopSettings } from '../../services/shopSettings'
import type { ApiContract } from '../../types/contract'
import { DOCUMENT_IMAGE_ACCEPT, isAcceptedDocumentImage } from '../../utils/imageUpload'

type FormValues = {
  salutation?: string
  customerFirstName: string
  customerLastName: string
  customerEmail?: string
  customerPhone: string
  customerDateOfBirth?: string
  customerStreet: string
  customerZipCode: string
  customerCity: string
  idDocumentNumber?: string
  idType?: string
  deviceType: string
  brand: string
  model: string
  imei?: string
  serialNumber?: string
  storage?: string
  color?: string
  condition: string
  accessories?: string
  batteryHealth?: string
  osVersion?: string
  icloudStatus?: string
  mdmStatus?: string
  warranty?: string
  purchaseReceiptAvailable?: boolean
  damageNotes?: string
  internalNotes?: string
  purchasePrice: number
  paymentMethod: string
  paymentStatus?: string
  notes?: string
  ownershipConfirmed: boolean
  notStolenConfirmed: boolean
  icloudRemoved: boolean
  googleLockRemoved: boolean
  otherLockRemoved: boolean
  factoryResetConfirmed: boolean
}

type FileField =
  | 'id_front'
  | 'id_back'
  | 'device_front'
  | 'device_back'
  | 'imei_photo'
  | 'damage_photo'
  | 'accessories_photo'

const DEVICE_TYPE_PRESETS = [
  'iPhone',
  'Samsung phone',
  'iPad',
  'Android tablet',
  'MacBook',
  'Windows laptop',
  'PlayStation',
  'Xbox',
  'Nintendo Switch',
  'Other',
] as const

const BRAND_PRESETS = [
  'Apple',
  'Samsung',
  'Xiaomi',
  'Huawei',
  'Lenovo',
  'HP',
  'Dell',
  'Sony',
  'Microsoft',
  'Nintendo',
  'Other',
] as const

const CONDITIONS = ['New', 'Like new', 'Very good', 'Good', 'Acceptable', 'Used', 'Defective'] as const
const PAYMENT_METHODS = ['Cash', 'Bank transfer', 'Card', 'Debit card', 'PayPal', 'Other'] as const
const PAYMENT_STATUSES = ['Paid', 'Pending', 'Partial payment'] as const
const SALUTATIONS = ['Mr', 'Ms', 'Diverse'] as const
const ID_TYPES = ['ID card', 'Passport', "Driver's license"] as const
const ACCESSORY_OPTIONS = ['Ladegerät', 'Netzteil', 'Controller', 'Kabel', 'Tragetasche', 'Sonstiges'] as const
const ICLOUD_STATUSES = ['Unlocked', 'Locked'] as const
const MDM_STATUSES = ['Yes', 'No'] as const
const WARRANTY_OPTIONS = ['AppleCare+', 'Manufacturer warranty', 'None'] as const

const requiredFileFields: FileField[] = ['id_front', 'device_front', 'device_back']
const maxDocumentUploadMb = 20

/**
 * Confirmations that must be ticked for every contract. Lock-removal
 * confirmations (iCloud/Google/other) are platform-specific and optional, so
 * they are intentionally excluded here and on the backend.
 */
const requiredConfirmationFields = [
  'ownershipConfirmed',
  'notStolenConfirmed',
  'factoryResetConfirmed',
] as const satisfies ReadonlyArray<keyof FormValues>

const stepFields: Record<number, Array<keyof FormValues>> = {
  0: [
    'customerFirstName',
    'customerLastName',
    'customerEmail',
    'customerPhone',
    'customerDateOfBirth',
    'customerStreet',
    'customerZipCode',
    'customerCity',
    'idDocumentNumber',
    'idType',
  ],
  1: [
    'deviceType',
    'brand',
    'model',
    'imei',
    'serialNumber',
    'storage',
    'color',
    'condition',
    'icloudStatus',
    'purchasePrice',
    'paymentMethod',
    'paymentStatus',
    'notes',
    'icloudStatus',
    'accessories',
    'batteryHealth',
    'osVersion',
    'mdmStatus',
    'warranty',
    'purchaseReceiptAvailable',
  ],
  2: [
    'ownershipConfirmed',
    'notStolenConfirmed',
    'icloudRemoved',
    'googleLockRemoved',
    'otherLockRemoved',
    'factoryResetConfirmed',
  ],
}

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

function cleanPayload(values: Partial<FormValues>): ContractDraftPayload {
  const payload: ContractDraftPayload = {}

  Object.entries(values).forEach(([key, value]) => {
    if (value === '' || value === undefined || value === null) return
    if (key === 'purchasePrice') {
      const numberValue = Number(value)
      if (Number.isFinite(numberValue) && numberValue > 0) {
        payload.purchasePrice = numberValue
      }
      return
    }
    ;(payload as Record<string, unknown>)[key] = value
  })

  return payload
}

function optionLabel(value: string, labels: OptionLabels) {
  return labels[value as keyof OptionLabels] ?? value
}

export function ContractWizard(props: {
  defaultStep?: number
  compact?: boolean
  initialContract?: ApiContract
  onCompleted?: (contract: ApiContract) => void
}) {
  const { t, interpolate, formatMoney } = useLanguage()
  const { showToast } = useAppConfirm()
  const w = t.contractWizard
  const { user } = useAuth()
  const navigate = useNavigate()
  const customerSigRef = useRef<SignatureCanvas | null>(null)
  const shopkeeperSigRef = useRef<SignatureCanvas | null>(null)
  const [step, setStep] = useState(props.defaultStep ?? 0)
  const [draftId, setDraftId] = useState<string | null>(
    props.initialContract?.status === 'Draft' ? props.initialContract.id : null,
  )
  const [files, setFiles] = useState<Partial<Record<FileField, File>>>({})
  const [customerSignatureDataUrl, setCustomerSignatureDataUrl] = useState<string | null>(null)
  const [shopkeeperSignatureDataUrl, setShopkeeperSignatureDataUrl] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmationAttempted, setConfirmationAttempted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [signatureMethod, setSignatureMethod] = useState<'onsite' | 'qr'>('onsite')
  const [qrToken, setQrToken] = useState<string | null>(props.initialContract?.signatureToken ?? null)
  const [qrStatus, setQrStatus] = useState<string | null>(props.initialContract?.signatureStatus ?? null)
  const [qrUrl, setQrUrl] = useState<string | null>(props.initialContract?.qrUrl ?? null)
  const [signatureLinkCopied, setSignatureLinkCopied] = useState(false)

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

  const requiredText = useMemo(
    () => (message: string) => ({
      required: message,
      validate: (value?: string) => Boolean(value?.trim()) || message,
    }),
    [],
  )

  const imeiValidation = useMemo(
    () => ({
      ...requiredText(w.imeiRequired),
      pattern: {
        value: /^\d{15}$/,
        message: w.imeiInvalid,
      },
    }),
    [w.imeiInvalid, w.imeiRequired, requiredText],
  )

  const photoFieldLabels = useMemo(
    (): Record<FileField, string> => ({
      id_front: w.photos.idFront,
      id_back: w.photos.idBack,
      device_front: w.photos.deviceFront,
      device_back: w.photos.deviceBack,
      imei_photo: w.photos.imeiPhoto,
      damage_photo: w.photos.damagePhoto,
      accessories_photo: w.photos.accessoriesPhoto,
    }),
    [w.photos],
  )

  const confirmationFields = useMemo(
    () =>
      [
        ['ownershipConfirmed', w.confirmations.ownershipConfirmed],
        ['notStolenConfirmed', w.confirmations.notStolenConfirmed],
        ['icloudRemoved', w.confirmations.icloudRemoved],
        ['googleLockRemoved', w.confirmations.googleLockRemoved],
        ['otherLockRemoved', w.confirmations.otherLockRemoved],
        ['factoryResetConfirmed', w.confirmations.factoryResetConfirmed],
      ] as const,
    [w.confirmations],
  )

  const steps = useMemo(
    () => [
      w.steps.customerInfo,
      w.steps.deviceInfo,
      w.steps.confirmations,
      w.steps.photos,
      w.steps.signature,
      w.steps.reviewSave,
    ],
    [w.steps],
  )

  const {
    register,
    handleSubmit,
    getValues,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<FormValues>({
    shouldUnregister: false,
    defaultValues: {
      customerFirstName: '',
      customerLastName: '',
      customerStreet: '',
      customerZipCode: '',
      customerCity: '',
      customerPhone: '',
      deviceType: 'iPhone',
      brand: 'Apple',
      condition: 'Good',
      icloudStatus: 'Unlocked',
      paymentMethod: 'Cash',
      ownershipConfirmed: false,
      notStolenConfirmed: false,
      icloudRemoved: false,
      googleLockRemoved: false,
      otherLockRemoved: false,
      factoryResetConfirmed: false,
      ...(props.initialContract ? contractToDraftPayload(props.initialContract) : {}),
    },
  })

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

  const values = watch()
  const title = props.compact ? w.titleCompact : w.titleFull
  const savedFileTypes = new Set(props.initialContract?.files?.map((file) => file.fileType) ?? [])

  const deviceTypePreset = (DEVICE_TYPE_PRESETS as readonly string[]).includes(values.deviceType ?? '')
    ? values.deviceType
    : 'Other'
  const brandPreset = (BRAND_PRESETS as readonly string[]).includes(values.brand ?? '') ? values.brand : 'Other'

  const hasRequiredFile = (field: FileField) => Boolean(files[field]) || savedFileTypes.has(field)
  const getLiveSignatureDataUrl = (ref: SignatureCanvas | null) =>
    ref && !ref.isEmpty() ? ref.toDataURL('image/png') : null
  const hasCustomerSignature =
    Boolean(props.initialContract?.signaturePath) ||
    Boolean(customerSignatureDataUrl) ||
    Boolean(getLiveSignatureDataUrl(customerSigRef.current)) ||
    (signatureMethod === 'qr' && qrStatus === 'SIGNED')
  const hasShopkeeperSignature =
    Boolean(props.initialContract?.shopkeeperSignaturePath) ||
    Boolean(shopkeeperSignatureDataUrl) ||
    Boolean(getLiveSignatureDataUrl(shopkeeperSigRef.current))

  const setFile = (field: FileField, file: File | null) => {
    setError(null)
    if (file && !isAcceptedDocumentImage(file)) {
      setError(w.errors.documentTypeInvalid)
      return
    }
    if (file && file.size > maxDocumentUploadMb * 1024 * 1024) {
      setError(interpolate(w.uploadTooLarge, { maxMb: maxDocumentUploadMb }))
      return
    }
    setFiles((current) => {
      const next = { ...current }
      if (file) next[field] = file
      else delete next[field]
      return next
    })
  }

  const persistDraft = async (valuesToSave: Partial<FormValues>) => {
    const payload = cleanPayload(valuesToSave)
    if (draftId) {
      return updateDraft(draftId, payload)
    }
    const draft = await createDraft(payload)
    setDraftId(draft.id)
    return draft
  }

  const uploadSelectedFiles = async (contractId: string) => {
    for (const [fileType, file] of Object.entries(files)) {
      if (file) {
        await uploadContractFile(contractId, fileType, file)
      }
    }
  }

  const uploadOneSignature = async (
    contractId: string,
    dataUrl: string | null,
    savedPath: string | null | undefined,
    role: 'customer' | 'shopkeeper',
    required: boolean,
  ) => {
    if (!dataUrl) {
      if (savedPath) return
      if (required) {
        throw new Error(
          role === 'customer'
            ? w.errors.customerSignatureRequired
            : w.errors.shopkeeperSignatureRequired,
        )
      }
      return
    }
    const blob = dataUrlToBlob(dataUrl)
    await uploadSignature(contractId, blob, role)
  }

  const uploadSignatures = async (contractId: string, required: boolean) => {
    const customerDataUrl = customerSignatureDataUrl || getLiveSignatureDataUrl(customerSigRef.current)
    const shopkeeperDataUrl = shopkeeperSignatureDataUrl || getLiveSignatureDataUrl(shopkeeperSigRef.current)

    await uploadOneSignature(
      contractId,
      customerDataUrl,
      props.initialContract?.signaturePath || (signatureMethod === 'qr' && qrStatus === 'SIGNED' ? 'qr-signed-placeholder' : null),
      'customer',
      required,
    )
    await uploadOneSignature(
      contractId,
      shopkeeperDataUrl,
      props.initialContract?.shopkeeperSignaturePath,
      'shopkeeper',
      required,
    )
  }

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

  const saveDraft = async () => {
    setError(null)
    setMessage(null)
    setIsSubmitting(true)
    try {
      const draft = await persistDraft(getValues())
      await uploadSelectedFiles(draft.id)
      await uploadSignatures(draft.id, false)
      setMessage(interpolate(w.draftSaved, { contractNumber: draft.contractNumber }))
      showToast('success', t.common.toasts.contractDraftSaved)
    } catch (err) {
      if (isDraftAlreadyCompletedError(err) && draftId) {
        try {
          const latest = await fetchContract(draftId)
          if (latest.status === 'Completed') {
            navigate(`/contracts/${latest.id}`, { replace: true })
            return
          }
        } catch {
          // Fall through to friendly error handling.
        }
      }
      logApiError('contract draft save', err)
      showToast('error', getFriendlyErrorMessage(err, 'contractSave', t))
    } finally {
      setIsSubmitting(false)
    }
  }

  const validateCurrentStep = async () => {
    setError(null)

    if (stepFields[step]) {
      const valid = await trigger(stepFields[step])
      if (!valid) return false
    }

    if (step === 1) {
      try {
        await validateDeviceIdentifiers({
          imei: getValues('imei'),
          serialNumber: getValues('serialNumber'),
          excludeId: draftId,
        })
      } catch (err) {
        logApiError('contract device identifier validation', err)
        if (err instanceof ApiError) {
          setError(err.message)
        } else {
          setError(w.imeiOrSerialExists) // Fallback for safety
        }
        return false
      }
    }

    if (step === 1 && !getValues('imei')?.trim() && !getValues('serialNumber')?.trim()) {
      setError(w.imeiOrSerialRequired)
      return false
    }

    if (step === 2) {
      const missingConfirmations = requiredConfirmationFields.filter((name) => !getValues(name))
      if (missingConfirmations.length > 0) {
        setConfirmationAttempted(true)
        setError(w.errors.confirmationsRequired)
        return false
      }
    }

    if (step === 3) {
      const missingFiles = requiredFileFields.filter((field) => !hasRequiredFile(field))
      if (missingFiles.length > 0) {
        setError(
          interpolate(w.errors.uploadsMissing, {
            fields: missingFiles.map((f) => photoFieldLabels[f]).join(', '),
          }),
        )
        return false
      }
    }

    if (step === 4) {
      if (signatureMethod === 'onsite' && !hasCustomerSignature) {
        setError(w.errors.customerSignatureRequired)
        return false
      }
      if (signatureMethod === 'qr' && qrStatus !== 'SIGNED' && !props.initialContract?.signaturePath) {
        setError(w.qrSignatureStatusWaiting)
        return false
      }
      if (!hasShopkeeperSignature) {
        setError(w.errors.shopkeeperSignatureRequired)
        return false
      }
    }

    return true
  }

  const goNext = async () => {
    if (await validateCurrentStep()) {
      setStep((current) => Math.min(steps.length - 1, current + 1))
    }
  }

  const customerDisplayName = [values.salutation, values.customerFirstName, values.customerLastName]
    .filter(Boolean)
    .join(' ')
  const customerDisplayAddress = [
    values.customerStreet,
    [values.customerZipCode, values.customerCity].filter(Boolean).join(' '),
  ]
    .filter(Boolean)
    .join(', ')
  const signaturePageUrl = (() => {
    if (!qrToken) return qrUrl
    const { hostname, origin } = window.location
    const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1'
    if (!isLocalHost) return `${origin}/signature/${qrToken}`
    return qrUrl ?? `${origin}/signature/${qrToken}`
  })()
  const qrCodeSrc = signaturePageUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(signaturePageUrl)}`
    : null

  const handleCopySignatureLink = async () => {
    if (!signaturePageUrl) return
    try {
      await navigator.clipboard.writeText(signaturePageUrl)
      setSignatureLinkCopied(true)
      window.setTimeout(() => setSignatureLinkCopied(false), 2000)
    } catch {
      setError(w.copySignatureLink)
    }
  }

  const complete = async (formValues: FormValues) => {
    setError(null)
    setMessage(null)

    if (!(await trigger())) return
    if (!formValues.imei?.trim() || !formValues.serialNumber?.trim()) {
      setError(w.imeiOrSerialRequired)
      setStep(1)
      return
    }

    const missingConfirmations = requiredConfirmationFields.filter((name) => !formValues[name])
    if (missingConfirmations.length > 0) {
      setConfirmationAttempted(true)
      setError(w.errors.confirmationsRequired)
      setStep(2)
      return
    }

    const missingFiles = requiredFileFields.filter((field) => !hasRequiredFile(field))
    if (missingFiles.length > 0) {
      setError(
        interpolate(w.errors.uploadsMissing, {
          fields: missingFiles.map((f) => photoFieldLabels[f]).join(', '),
        }),
      )
      setStep(3)
      return
    }

    if (!hasCustomerSignature || !hasShopkeeperSignature) {
      setError(w.errors.bothSignaturesRequired)
      setStep(4)
      return
    }

    if (!user?.id) {
      setError(w.errors.loginRequired)
      return
    }

    const shopSettings = await loadShopSettings(user.id)

    setIsSubmitting(true)
    try {
      const draft = await persistDraft(formValues)
      await uploadSelectedFiles(draft.id)
      await uploadSignatures(draft.id, true)
      const completed = await completeContract(draft.id, {}, shopSettings)
      props.onCompleted?.(completed)
      showToast('success', t.common.toasts.contractCreated)
      navigate(`/contracts/${completed.id}`, { replace: true })
    } catch (err) {
      if (isDraftAlreadyCompletedError(err) && draftId) {
        try {
          const latest = await fetchContract(draftId)
          if (latest.status === 'Completed') {
            props.onCompleted?.(latest)
            showToast('success', t.common.toasts.contractCreated)
            navigate(`/contracts/${latest.id}`, { replace: true })
            return
          }
        } catch {
          // Fall through to friendly error handling.
        }
      }
      logApiError('contract complete', err)
      showToast('error', getFriendlyErrorMessage(err, 'contractSave', t))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="card min-w-0 overflow-hidden" data-testid="contract-wizard">
      <div className="card-header">
        <div className="text-sm font-semibold text-slate-900 sm:text-base">{title}</div>
      </div>

      <div className="px-4 pt-4 sm:px-5">
        <div className="-mx-4 overflow-x-auto px-4 sm:-mx-5 sm:px-5">
          <div className="flex min-w-max items-center gap-3 border-b border-slate-200 pb-4 sm:gap-4">
            {steps.map((label, idx) => {
              const active = idx === step
              const done = idx < step
              return (
                <button
                  type="button"
                  key={label}
                  onClick={() => setStep(idx)}
                  className="flex shrink-0 items-center gap-2 text-left"
                >
                  <span
                    className={clsx(
                      'grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-semibold ring-1',
                      active && 'bg-primary text-white ring-primary',
                      done && 'bg-primary-light text-primary ring-primary-ring',
                      !active && !done && 'bg-white text-slate-500 ring-slate-200',
                    )}
                  >
                    {idx + 1}
                  </span>
                  <span
                    className={clsx(
                      'whitespace-nowrap text-xs font-semibold',
                      active ? 'text-slate-900' : 'text-slate-500',
                    )}
                  >
                    {label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(complete)} className="space-y-6 p-4 sm:p-5">
        {error ? (
          <div
            data-testid="wizard-error"
            className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-100"
          >
            {error}
          </div>
        ) : null}
        {message ? (
          <div
            data-testid="wizard-message"
            className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 ring-1 ring-emerald-100"
          >
            {message}
          </div>
        ) : null}

        {step === 0 ? (
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2 text-xs font-semibold text-slate-700">
              {w.customerInformation}
            </div>
            <SelectField
              label={w.salutation}
              options={SALUTATIONS}
              optionLabels={w.options}
              register={register('salutation')}
            />
            <Field
              label={w.firstName}
              error={errors.customerFirstName?.message || (errors.customerFirstName && w.firstNameRequired)}
            >
              <input
                className="input"
                data-testid="wizard-customer-first-name"
                placeholder={w.firstNamePlaceholder}
                {...register('customerFirstName', requiredText(w.firstNameRequired))}
              />
            </Field>
            <Field
              label={w.lastName}
              error={errors.customerLastName?.message || (errors.customerLastName && w.lastNameRequired)}
            >
              <input
                className="input"
                data-testid="wizard-customer-last-name"
                placeholder={w.lastNamePlaceholder}
                {...register('customerLastName', requiredText(w.lastNameRequired))}
              />
            </Field>
            <Field label={w.phone} error={errors.customerPhone?.message || (errors.customerPhone && w.phoneRequired)}>
              <input
                className="input"
                data-testid="wizard-customer-phone"
                placeholder={w.phonePlaceholder}
                {...register('customerPhone', {
                  ...requiredText(w.phoneRequired),
                  minLength: { value: 5, message: w.phoneTooShort },
                })}
              />
            </Field>
            <Field label={w.email} error={errors.customerEmail?.message}>
              <input
                className="input"
                type="email"
                data-testid="wizard-customer-email"
                placeholder={w.emailPlaceholder}
                {...register('customerEmail', {
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: w.emailInvalid,
                  },
                })}
              />
            </Field>
            <Field label={w.dob} error={errors.customerDateOfBirth?.message}>
              <input className="input" type="date" data-testid="wizard-customer-dob" {...register('customerDateOfBirth')} />
            </Field>
            <Field
              label={w.street}
              error={errors.customerStreet?.message || (errors.customerStreet && w.streetRequired)}
            >
              <input
                className="input"
                data-testid="wizard-customer-street"
                placeholder={w.streetPlaceholder}
                {...register('customerStreet', requiredText(w.streetRequired))}
              />
            </Field>
            <Field
              label={w.zipCode}
              error={errors.customerZipCode?.message || (errors.customerZipCode && w.zipCodeRequired)}
            >
              <input
                className="input"
                data-testid="wizard-customer-zip"
                placeholder={w.zipCodePlaceholder}
                {...register('customerZipCode', requiredText(w.zipCodeRequired))}
              />
            </Field>
            <Field
              label={w.city}
              error={errors.customerCity?.message || (errors.customerCity && w.cityRequired)}
            >
              <input
                className="input"
                data-testid="wizard-customer-city"
                placeholder={w.cityPlaceholder}
                {...register('customerCity', requiredText(w.cityRequired))}
              />
            </Field>
            <SelectField
              label={w.idType}
              options={ID_TYPES}
              optionLabels={w.options}
              register={register('idType')}
            />
            <Field label={w.idDocument} error={errors.idDocumentNumber?.message} wide>
              <input
                className="input"
                data-testid="wizard-id-document"
                placeholder={w.idDocumentPlaceholder}
                {...register('idDocumentNumber')}
              />
            </Field>
          </section>
        ) : null}

        {step === 1 ? (
          <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="md:col-span-3 text-xs font-semibold text-slate-700">
              {w.deviceInformation}
            </div>
            <Field label={w.deviceType} error={errors.deviceType?.message}>
              {/* Keep form validation in react-hook-form, while UI is a preset dropdown + optional custom input. */}
              <input type="hidden" {...register('deviceType', requiredText(w.deviceTypeRequired))} />
              <select
                className="input"
                value={deviceTypePreset}
                onChange={(event) => {
                  const nextPreset = event.target.value
                  const isCustomCurrently = deviceTypePreset === 'Other'

                  // If the user switches from a preset to "Other", start with empty input only when they
                  // were not already entering a custom value.
                  if (nextPreset === 'Other' && !isCustomCurrently) {
                    setValue('deviceType', '', { shouldValidate: true, shouldDirty: true })
                  } else if (nextPreset !== 'Other') {
                    setValue('deviceType', nextPreset, { shouldValidate: true, shouldDirty: true })
                  }
                }}
              >
                {(DEVICE_TYPE_PRESETS as readonly string[]).filter((x) => x !== 'Other').map((preset) => (
                  <option key={preset} value={preset}>
                    {optionLabel(preset, w.options)}
                  </option>
                ))}
                <option value="Other">{w.options.Other}</option>
              </select>
              {deviceTypePreset === 'Other' ? (
                <input
                  className="input mt-2"
                  placeholder={w.deviceTypeCustomPlaceholder}
                  value={values.deviceType ?? ''}
                  onChange={(event) => {
                    setValue('deviceType', event.target.value, { shouldValidate: true, shouldDirty: true })
                  }}
                />
              ) : null}
            </Field>
            <Field label={w.brand} error={errors.brand?.message || (errors.brand && w.brandRequired)}>
              <input type="hidden" {...register('brand', requiredText(w.brandRequired))} />
              <select
                className="input"
                value={brandPreset}
                onChange={(event) => {
                  const nextPreset = event.target.value
                  const isCustomCurrently = brandPreset === 'Other'

                  if (nextPreset === 'Other' && !isCustomCurrently) {
                    setValue('brand', '', { shouldValidate: true, shouldDirty: true })
                  } else if (nextPreset !== 'Other') {
                    setValue('brand', nextPreset, { shouldValidate: true, shouldDirty: true })
                  }
                }}
              >
                {(BRAND_PRESETS as readonly string[]).filter((x) => x !== 'Other').map((preset) => (
                  <option key={preset} value={preset}>
                    {optionLabel(preset, w.options)}
                  </option>
                ))}
                <option value="Other">{w.options.Other}</option>
              </select>
              {brandPreset === 'Other' ? (
                <input
                  className="input mt-2"
                  placeholder={w.brandCustomPlaceholder}
                  value={values.brand ?? ''}
                  onChange={(event) => {
                    setValue('brand', event.target.value, { shouldValidate: true, shouldDirty: true })
                  }}
                />
              ) : null}
            </Field>
            <Field label={w.model} error={errors.model?.message || (errors.model && w.modelRequired)}>
              <input className="input" data-testid="wizard-model" placeholder={w.modelPlaceholder} {...register('model', requiredText(w.modelRequired))} />
            </Field>
            <Field label={w.imei} error={errors.imei?.message}>
              <input className="input" data-testid="wizard-imei" inputMode="numeric" maxLength={15} placeholder={w.imeiPlaceholder} {...register('imei', imeiValidation)} />
            </Field>
            <Field label={w.serialNumber} error={errors.serialNumber?.message}>
              <input className="input" data-testid="wizard-serial" placeholder={w.serialNumberPlaceholder} {...register('serialNumber', requiredText(w.serialNumberRequired))} />
            </Field>
            <SelectField
              label={w.condition}
              options={CONDITIONS}
              optionLabels={w.options}
              register={register('condition', { required: w.conditionRequired })}
            />
            <Field label={w.purchasePrice} error={errors.purchasePrice?.message || (errors.purchasePrice && w.priceMin)}>
              <input
                className="input"
                type="number"
                step="0.01"
                data-testid="wizard-purchase-price"
                placeholder={w.purchasePricePlaceholder}
                {...register('purchasePrice', {
                  required: w.purchasePriceRequired,
                  min: { value: 0.01, message: w.priceMin },
                })}
              />
            </Field>
            <SelectField
              label={w.paymentMethod}
              options={PAYMENT_METHODS}
              optionLabels={w.options}
              register={register('paymentMethod', { required: w.paymentMethodRequired })}
            />
            <Field label={w.paymentStatus} error={errors.paymentStatus?.message}>
              <select className="input" data-testid="wizard-payment-status" {...register('paymentStatus')}>
                <option value="">{w.paymentStatusPlaceholder}</option>
                {PAYMENT_STATUSES.map(s => (
                  <option key={s} value={s}>{w.options[s as keyof typeof w.options] ?? s}</option>
                ))}
              </select>
            </Field>
            <Field label={w.storage} error={errors.storage?.message}>
              <input className="input" data-testid="wizard-storage" placeholder={w.storagePlaceholder} {...register('storage', requiredText(w.storageRequired))} />
            </Field>
            <Field label={w.color} error={errors.color?.message}>
              <input className="input" data-testid="wizard-color" placeholder={w.colorPlaceholder} {...register('color', requiredText(w.colorRequired))} />
            </Field>
            {/* Multi-select Accessories */}
            <Field label={w.accessories} wide>
              <div className="grid grid-cols-2 gap-2">
                {ACCESSORY_OPTIONS.map((option) => (
                  <label key={option} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-primary"
                      checked={(values.accessories ?? '').split(',').map(s => s.trim()).filter(Boolean).includes(option)}
                      onChange={(e) => {
                        const current = (values.accessories ?? '').split(',').map(s => s.trim()).filter(Boolean)
                        const next = e.target.checked
                          ? [...current, option]
                          : current.filter(a => a !== option)
                        setValue('accessories', next.join(', '), { shouldDirty: true, shouldValidate: true })
                      }}
                    />
                    {optionLabel(option, w.options)}
                  </label>
                ))}
              </div>
            </Field>
            <Field label={w.batteryHealth} error={errors.batteryHealth?.message}>
              <input className="input" data-testid="wizard-battery" placeholder={w.batteryHealthPlaceholder} {...register('batteryHealth')} />
            </Field>
            {/* iCloud Status (Unlocked / Locked) */}
            <Field label={w.icloudStatus} error={errors.icloudStatus?.message}>
              <select className="input" data-testid="wizard-icloud-status" {...register('icloudStatus', { required: w.icloudStatusRequired })}>
                <option value="">{w.icloudStatusPlaceholder}</option>
                {ICLOUD_STATUSES.map(s => (
                  <option key={s} value={s}>{w.options[s as keyof typeof w.options] ?? s}</option>
                ))}
              </select>
            </Field>
            {/* MDM Status */}
            <Field label={w.mdmStatus}>
              <select className="input" data-testid="wizard-mdm-status" {...register('mdmStatus')}>
                <option value="">{w.mdmStatusPlaceholder}</option>
                {MDM_STATUSES.map(s => (
                  <option key={s} value={s}>{w.options[s as keyof typeof w.options] ?? s}</option>
                ))}
              </select>
            </Field>
            {/* OS Version */}
            <Field label={w.osVersion}>
              <input className="input" data-testid="wizard-os-version" placeholder={w.osVersionPlaceholder} {...register('osVersion')} />
            </Field>
            {/* Warranty */}
            <Field label={w.warranty}>
              <select className="input" data-testid="wizard-warranty" {...register('warranty')}>
                <option value="">{w.warrantyPlaceholder}</option>
                {WARRANTY_OPTIONS.map(s => (
                  <option key={s} value={s}>{w.options[s as keyof typeof w.options] ?? s}</option>
                ))}
              </select>
            </Field>
            {/* Purchase Receipt */}
            <label className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                data-testid="wizard-purchase-receipt"
                className="h-4 w-4 rounded border-slate-300 text-primary"
                checked={Boolean(values.purchaseReceiptAvailable)}
                onChange={(e) => setValue('purchaseReceiptAvailable', e.target.checked, { shouldDirty: true })}
              />
              {w.purchaseReceiptAvailable}
            </label>
            <Field label={w.damageNotes} error={errors.damageNotes?.message} wide>
              <textarea className="input min-h-20 py-2" placeholder={w.damageNotesPlaceholder} {...register('damageNotes')} />
            </Field>
            <Field label={w.internalNotes} error={errors.internalNotes?.message} wide>
              <textarea className="input min-h-20 py-2" placeholder={w.internalNotesPlaceholder} {...register('internalNotes')} />
            </Field>
            <Field label={w.notes} error={errors.notes?.message} wide>
              <textarea className="input min-h-20 py-2" placeholder={w.notesPlaceholder} {...register('notes')} />
            </Field>
          </section>
        ) : null}

        {step === 2 ? (
          <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="md:col-span-2 text-xs font-semibold text-slate-700">
              {w.ownershipConfirmations}
            </div>
            {confirmationFields.map(([name, label]) => {
              const isRequired = (requiredConfirmationFields as readonly string[]).includes(name)
              const isMissing = confirmationAttempted && isRequired && !values[name]
              return (
                <label
                  key={name}
                  className={clsx(
                    'flex items-center gap-3 rounded-lg border px-3 py-2 text-sm font-medium text-slate-700',
                    isMissing ? 'border-red-400 bg-red-50' : 'border-slate-200',
                  )}
                >
                  <input
                    type="checkbox"
                    data-testid={`wizard-confirm-${name}`}
                    className="h-4 w-4 rounded border-slate-300 text-primary"
                    checked={Boolean(values[name])}
                    onChange={(event) => {
                      setValue(name, event.target.checked, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }}
                  />
                  <span>
                    {label}
                    {isRequired ? <span className="ml-1 text-red-500">*</span> : null}
                  </span>
                </label>
              )
            })}
            {confirmationAttempted &&
            requiredConfirmationFields.some((name) => !values[name]) ? (
              <p className="md:col-span-2 text-xs font-medium text-red-600">
                {w.errors.confirmationsRequired}
              </p>
            ) : null}
          </section>
        ) : null}

        {step === 3 ? (
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2 text-xs font-semibold text-slate-700">
              {w.photosAndDocuments}
            </div>
            <p className="md:col-span-2 text-xs text-slate-500">{w.photosRequiredHint}</p>
            <FileInput testId="wizard-upload-id_front" label={w.photos.idFront} field="id_front" files={files} saved={savedFileTypes.has('id_front')} onChange={setFile} removeLabel={t.common.remove} savedHint={w.savedUploadReplace} formatHint={w.uploadFormatsLarge} />
            <FileInput testId="wizard-upload-id_back" label={w.photos.idBack} field="id_back" files={files} saved={savedFileTypes.has('id_back')} onChange={setFile} removeLabel={t.common.remove} savedHint={w.savedUploadReplace} formatHint={w.uploadFormatsLarge} />
            <FileInput testId="wizard-upload-device_front" label={w.photos.deviceFront} field="device_front" files={files} saved={savedFileTypes.has('device_front')} onChange={setFile} removeLabel={t.common.remove} savedHint={w.savedUploadReplace} formatHint={w.uploadFormatsLarge} />
            <FileInput testId="wizard-upload-device_back" label={w.photos.deviceBack} field="device_back" files={files} saved={savedFileTypes.has('device_back')} onChange={setFile} removeLabel={t.common.remove} savedHint={w.savedUploadReplace} formatHint={w.uploadFormatsLarge} />
            <FileInput label={w.photos.imeiPhoto} field="imei_photo" files={files} saved={savedFileTypes.has('imei_photo')} onChange={setFile} removeLabel={t.common.remove} savedHint={w.savedUploadReplace} formatHint={w.uploadFormatsLarge} />
            <FileInput label={w.photos.damagePhoto} field="damage_photo" files={files} saved={savedFileTypes.has('damage_photo')} onChange={setFile} removeLabel={t.common.remove} savedHint={w.savedUploadReplace} formatHint={w.uploadFormatsLarge} />
            <FileInput label={w.photos.accessoriesPhoto} field="accessories_photo" files={files} saved={savedFileTypes.has('accessories_photo')} onChange={setFile} removeLabel={t.common.remove} savedHint={w.savedUploadReplace} formatHint={w.uploadFormatsLarge} />
          </section>
        ) : null}

        {step === 4 ? (
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="flex flex-col gap-4">
              <div className="flex border-b border-slate-200">
                <button
                  type="button"
                  onClick={() => setSignatureMethod('onsite')}
                  className={clsx(
                    'border-b-2 px-4 py-2 text-sm font-semibold focus:outline-none',
                    signatureMethod === 'onsite'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-slate-500 hover:text-slate-700',
                  )}
                >
                  {w.signatureMethodOnsite}
                </button>
                <button
                  type="button"
                  onClick={() => setSignatureMethod('qr')}
                  className={clsx(
                    'border-b-2 px-4 py-2 text-sm font-semibold focus:outline-none',
                    signatureMethod === 'qr'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-slate-500 hover:text-slate-700',
                  )}
                >
                  {w.signatureMethodQr}
                </button>
              </div>

              {signatureMethod === 'onsite' ? (
                <SignatureBox
                  testId="wizard-signature-customer"
                  title={w.customerSignatureTitle}
                  clearLabel={w.clear}
                  savedHint={w.savedSignatureReplace}
                  refSetter={(ref) => {
                    customerSigRef.current = ref
                  }}
                  onChange={() => {
                    const dataUrl = getLiveSignatureDataUrl(customerSigRef.current)
                    setCustomerSignatureDataUrl(dataUrl)
                    setError(null)
                  }}
                  onClear={() => {
                    customerSigRef.current?.clear()
                    setCustomerSignatureDataUrl(null)
                  }}
                  saved={Boolean(props.initialContract?.signaturePath)}
                />
              ) : (
                <div className="flex flex-col items-center space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
                  <div className="text-sm font-bold text-slate-800">{w.qrSignatureTitle}</div>
                  <p className="max-w-[280px] text-xs text-slate-500">{w.qrSignatureInstructions}</p>

                  {qrCodeSrc ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                        <img src={qrCodeSrc} alt="QR code" className="h-[180px] w-[180px]" />
                      </div>
                      <div className="w-full max-w-[280px] space-y-2 rounded-lg border border-slate-200 bg-white p-3 text-left">
                        <div className="text-xs font-semibold text-slate-700">{w.customerSignatureLink}</div>
                        <a
                          href={signaturePageUrl ?? '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-primary underline-offset-2 hover:underline"
                        >
                          {w.openSignaturePage}
                        </a>
                        <p className="break-all text-xs text-slate-500">{signaturePageUrl}</p>
                        <button
                          type="button"
                          className="btn btn-ghost h-8 px-3 text-xs"
                          onClick={handleCopySignatureLink}
                        >
                          {signatureLinkCopied ? w.signatureLinkCopied : w.copySignatureLink}
                        </button>
                      </div>
                      <div
                        className={clsx(
                          'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold',
                          qrStatus === 'SIGNED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800 animate-pulse',
                        )}
                      >
                        <span
                          className={clsx(
                            'h-2 w-2 rounded-full',
                            qrStatus === 'SIGNED' ? 'bg-emerald-500' : 'bg-amber-500',
                          )}
                        />
                        {qrStatus === 'SIGNED' ? w.qrSignatureStatusSigned : w.qrSignatureStatusWaiting}
                      </div>
                    </div>
                  ) : null}

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleGenerateQr}
                    className="btn btn-primary mt-4 w-full disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {w.qrSignatureGenerateBtn}
                  </button>
                </div>
              )}
            </div>
            <SignatureBox
              testId="wizard-signature-shopkeeper"
              title={w.shopkeeperSignatureTitle}
              clearLabel={w.clear}
              savedHint={w.savedSignatureReplace}
              refSetter={(ref) => {
                shopkeeperSigRef.current = ref
              }}
              onChange={() => {
                const dataUrl = getLiveSignatureDataUrl(shopkeeperSigRef.current)
                setShopkeeperSignatureDataUrl(dataUrl)
                setError(null)
              }}
              onClear={() => {
                shopkeeperSigRef.current?.clear()
                setShopkeeperSignatureDataUrl(null)
              }}
              saved={Boolean(props.initialContract?.shopkeeperSignaturePath)}
            />
          </section>
        ) : null}

        {step === 5 ? (
          <section className="space-y-4">
            <div className="text-xs font-semibold text-slate-700">{w.checkAndSave}</div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <ReviewCard
                title={w.review.customer}
                dash={t.common.dash}
                rows={[
                  [w.review.name, customerDisplayName],
                  [w.review.phone, values.customerPhone],
                  [w.review.email, values.customerEmail],
                  [w.review.address, customerDisplayAddress],
                  [w.review.notes, values.notes],
                ]}
              />
              <ReviewCard
                title={w.review.device}
                dash={t.common.dash}
                rows={[
                  [w.review.device, [values.brand, values.model].filter(Boolean).join(' ')],
                  [w.review.imeiSerial, values.imei || values.serialNumber],
                  [w.review.condition, values.condition ? optionLabel(values.condition, w.options) : undefined],
                  [w.review.price, values.purchasePrice ? formatMoney(Number(values.purchasePrice)) : undefined],
                  [w.paymentMethod.replace(' *', ''), values.paymentMethod ? optionLabel(values.paymentMethod, w.options) : undefined],
                  [w.paymentStatus, values.paymentStatus ? optionLabel(values.paymentStatus, w.options) : undefined],
                  [w.notes, values.notes],
                ]}
              />
              <ReviewCard
                title={w.review.filesAndSignatures}
                dash={t.common.dash}
                rows={[
                  [w.review.requiredFiles, `${requiredFileFields.filter((field) => hasRequiredFile(field)).length}/${requiredFileFields.length}`],
                  [w.review.customerSignature, hasCustomerSignature ? w.review.captured : w.review.missing],
                  [w.review.shopkeeperSignature, hasShopkeeperSignature ? w.review.captured : w.review.missing],
                  [w.review.pdf, w.review.pdfAfterCompletion],
                ]}
              />
            </div>
          </section>
        ) : null}

        <FormActionFooter testId="contract-wizard-footer">
          <button
            type="button"
            data-testid="wizard-save-draft"
            disabled={isSubmitting}
            onClick={saveDraft}
            className="btn btn-secondary h-11 px-5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {w.saveDraft}
          </button>
          <button
            type="button"
            data-testid="wizard-back"
            disabled={isSubmitting || step === 0}
            onClick={() => setStep((current) => Math.max(0, current - 1))}
            className="btn btn-secondary h-11 px-5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {w.back}
          </button>
          {step < steps.length - 1 ? (
            <button
              type="button"
              data-testid="wizard-next"
              disabled={isSubmitting}
              onClick={goNext}
              className="btn btn-primary h-11 px-5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {w.next}
            </button>
          ) : (
            <button
              type="submit"
              data-testid="wizard-complete"
              disabled={isSubmitting}
              className="btn btn-primary h-11 px-5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? w.saving : w.completeAndPdf}
            </button>
          )}
        </FormActionFooter>
      </form>
    </div>
  )
}

function Field(props: {
  label: string
  error?: string | false
  wide?: boolean
  children: ReactNode
}) {
  return (
    <div className={props.wide ? 'md:col-span-2' : undefined}>
      <label className="label">{props.label}</label>
      {props.children}
      {props.error ? <div className="mt-1 text-xs text-red-600">{props.error}</div> : null}
    </div>
  )
}

function SelectField(props: {
  label: string
  options: readonly string[]
  optionLabels: OptionLabels
  register: UseFormRegisterReturn
}) {
  return (
    <Field label={props.label}>
      <select className="input" {...props.register}>
        {props.options.map((option) => (
          <option key={option} value={option}>
            {optionLabel(option, props.optionLabels)}
          </option>
        ))}
      </select>
    </Field>
  )
}

function FileInput(props: {
  testId?: string
  label: string
  field: FileField
  files: Partial<Record<FileField, File>>
  saved?: boolean
  onChange: (field: FileField, file: File | null) => void
  removeLabel: string
  savedHint: string
  formatHint: string
}) {
  const file = props.files[props.field]

  return (
    <div>
      <label className="label">{props.label}</label>
      <input
        type="file"
        data-testid={props.testId ?? `wizard-upload-${props.field}`}
        accept={DOCUMENT_IMAGE_ACCEPT}
        className="input py-2"
        onChange={(event) => {
          props.onChange(props.field, event.target.files?.[0] ?? null)
          event.target.value = ''
        }}
      />
      {file ? (
        <div className="mt-1 flex items-center justify-between gap-3 text-xs text-slate-500">
          <span className="truncate">{file.name}</span>
          <button
            type="button"
            className="font-semibold text-red-600"
            onClick={() => props.onChange(props.field, null)}
          >
            {props.removeLabel}
          </button>
        </div>
      ) : props.saved ? (
        <div className="mt-1 text-xs font-semibold text-emerald-700">{props.savedHint}</div>
      ) : (
        <div className="mt-1 text-xs text-slate-500">{props.formatHint}</div>
      )}
    </div>
  )
}

function SignatureBox(props: {
  testId?: string
  title: string
  clearLabel: string
  savedHint: string
  refSetter: (ref: SignatureCanvas | null) => void
  onChange: () => void
  onClear: () => void
  saved?: boolean
}) {
  return (
    <div>
      <div className="text-xs font-semibold text-slate-700">{props.title}</div>
      {props.saved ? (
        <div className="mt-1 text-xs font-semibold text-emerald-700">{props.savedHint}</div>
      ) : null}
      <div className="mt-3 rounded-xl border border-slate-200 bg-white">
        <div className="h-[180px] overflow-hidden rounded-t-xl bg-white" data-testid={props.testId}>
          <SignatureCanvas
            ref={props.refSetter}
            onEnd={props.onChange}
            canvasProps={{
              className: 'h-[180px] w-full',
            }}
          />
        </div>
        <div className="flex justify-end border-t border-slate-200 px-4 py-3">
          <button type="button" className="btn btn-ghost h-9 px-3" onClick={props.onClear}>
            {props.clearLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

function ReviewCard(props: {
  title: string
  dash: string
  rows: Array<[string, string | number | undefined]>
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="text-sm font-semibold text-slate-900">{props.title}</div>
      <div className="mt-3 space-y-2 text-sm">
        {props.rows.map(([label, value]) => (
          <div key={label} className="flex items-start justify-between gap-3">
            <span className="text-slate-500">{label}</span>
            <span className="max-w-[60%] text-right font-semibold text-slate-900">
              {value || props.dash}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
