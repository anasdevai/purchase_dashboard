import { useMemo, useRef, useState, type ReactNode } from 'react'
import { useForm, type UseFormRegisterReturn } from 'react-hook-form'
import SignatureCanvas from 'react-signature-canvas'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import {
  contractToDraftPayload,
  completeContract,
  createDraft,
  fetchContract,
  updateDraft,
  uploadContractFile,
  uploadSignature,
  validateDeviceIdentifiers,
  type ContractDraftPayload,
} from '../../api/contracts'
import { useLanguage } from '../../i18n/LanguageProvider'
import type { OptionLabels } from '../../i18n/types'
import { useAuth } from '../../auth/AuthContext'
import { loadShopSettings } from '../../services/shopSettings'
import type { ApiContract } from '../../types/contract'

type FormValues = {
  customerName: string
  customerEmail?: string
  customerPhone: string
  customerDateOfBirth?: string
  customerAddress: string
  idDocumentNumber?: string
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
  damageNotes?: string
  internalNotes?: string
  purchasePrice: number
  paymentMethod: string
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

const DEVICE_TYPES = [
  'Smartphone',
  'Tablet',
  'Laptop',
  'Desktop PC',
  'Smartwatch',
  'Gaming console',
  'Other',
] as const

const CONDITIONS = ['Like new', 'Very good', 'Good', 'Used', 'Defective'] as const
const PAYMENT_METHODS = ['Cash', 'Bank transfer', 'Card', 'Other'] as const

const requiredFileFields: FileField[] = [
  'id_front',
  'id_back',
  'device_front',
  'device_back',
  'imei_photo',
  'damage_photo',
  'accessories_photo',
]
const maxDocumentUploadMb = 20

const stepFields: Record<number, Array<keyof FormValues>> = {
  0: [
    'customerName',
    'customerEmail',
    'customerPhone',
    'customerDateOfBirth',
    'customerAddress',
    'idDocumentNumber',
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
    'purchasePrice',
    'paymentMethod',
    'accessories',
    'batteryHealth',
    'damageNotes',
    'internalNotes',
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

function isDocumentFile(file: File) {
  return file.type === 'image/png' || file.type === 'image/svg+xml'
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
  const { t, interpolate } = useLanguage()
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
  const [isSubmitting, setIsSubmitting] = useState(false)

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
    trigger,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      customerName: '',
      customerPhone: '',
      customerAddress: '',
      deviceType: 'Smartphone',
      condition: 'Good',
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

  const values = watch()
  const title = props.compact ? w.titleCompact : w.titleFull
  const savedFileTypes = new Set(props.initialContract?.files?.map((file) => file.fileType) ?? [])
  const hasRequiredFile = (field: FileField) => Boolean(files[field]) || savedFileTypes.has(field)
  const getLiveSignatureDataUrl = (ref: SignatureCanvas | null) =>
    ref && !ref.isEmpty() ? ref.toDataURL('image/png') : null
  const hasCustomerSignature =
    Boolean(props.initialContract?.signaturePath) ||
    Boolean(customerSignatureDataUrl) ||
    Boolean(getLiveSignatureDataUrl(customerSigRef.current))
  const hasShopkeeperSignature =
    Boolean(props.initialContract?.shopkeeperSignaturePath) ||
    Boolean(shopkeeperSignatureDataUrl) ||
    Boolean(getLiveSignatureDataUrl(shopkeeperSigRef.current))

  const setFile = (field: FileField, file: File | null) => {
    setError(null)
    if (file && !isDocumentFile(file)) {
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
      props.initialContract?.signaturePath,
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

  const saveDraft = async () => {
    setError(null)
    setMessage(null)
    setIsSubmitting(true)
    try {
      const draft = await persistDraft(getValues())
      await uploadSelectedFiles(draft.id)
      await uploadSignatures(draft.id, false)
      setMessage(interpolate(w.draftSaved, { contractNumber: draft.contractNumber }))
    } catch (err) {
      if (draftId && err instanceof Error && err.message.includes('Only draft contracts')) {
        try {
          const latest = await fetchContract(draftId)
          if (latest.status === 'Completed') {
            navigate(`/contracts/${latest.id}`, { replace: true })
            return
          }
        } catch {
          // Keep the original backend message below.
        }
      }
      setError(err instanceof Error ? err.message : w.errors.draftSaveFailed)
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
        setError(err instanceof Error ? err.message : w.imeiOrSerialExists)
        return false
      }
    }

    if (step === 1 && !getValues('imei')?.trim() && !getValues('serialNumber')?.trim()) {
      setError(w.imeiOrSerialRequired)
      return false
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
      if (!hasCustomerSignature) {
        setError(w.errors.customerSignatureRequired)
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

  const complete = async (formValues: FormValues) => {
    setError(null)
    setMessage(null)

    if (!(await trigger())) return
    if (!formValues.imei?.trim() || !formValues.serialNumber?.trim()) {
      setError(w.imeiOrSerialRequired)
      setStep(1)
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
      navigate(`/contracts/${completed.id}`, { replace: true })
    } catch (err) {
      if (draftId && err instanceof Error && err.message.includes('Only draft contracts')) {
        try {
          const latest = await fetchContract(draftId)
          if (latest.status === 'Completed') {
            props.onCompleted?.(latest)
            navigate(`/contracts/${latest.id}`, { replace: true })
            return
          }
        } catch {
          // Keep the original backend message below.
        }
      }
      setError(err instanceof Error ? err.message : w.errors.completeFailed)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="card min-w-0 overflow-hidden">
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
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-100">
            {error}
          </div>
        ) : null}
        {message ? (
          <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 ring-1 ring-emerald-100">
            {message}
          </div>
        ) : null}

        {step === 0 ? (
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2 text-xs font-semibold text-slate-700">
              {w.customerInformation}
            </div>
            <Field label={w.fullName} error={errors.customerName?.message || (errors.customerName && w.fullNameRequired)}>
              <input className="input" placeholder={w.fullNamePlaceholder} {...register('customerName', requiredText(w.fullNameRequired))} />
            </Field>
            <Field label={w.email} error={errors.customerEmail?.message}>
              <input
                className="input"
                type="email"
                placeholder={w.emailPlaceholder}
                {...register('customerEmail', {
                  ...requiredText(w.emailRequired),
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: w.emailInvalid,
                  },
                })}
              />
            </Field>
            <Field label={w.phone} error={errors.customerPhone?.message || (errors.customerPhone && w.phoneRequired)}>
              <input
                className="input"
                placeholder={w.phonePlaceholder}
                {...register('customerPhone', {
                  ...requiredText(w.phoneRequired),
                  minLength: { value: 5, message: w.phoneTooShort },
                })}
              />
            </Field>
            <Field label={w.dob} error={errors.customerDateOfBirth?.message}>
              <input className="input" type="date" {...register('customerDateOfBirth', requiredText(w.dobRequired))} />
            </Field>
            <Field label={w.address} error={errors.customerAddress?.message || (errors.customerAddress && w.addressRequired)} wide>
              <textarea className="input min-h-24 py-2" placeholder={w.addressPlaceholder} {...register('customerAddress', requiredText(w.addressRequired))} />
            </Field>
            <Field label={w.idDocument} error={errors.idDocumentNumber?.message} wide>
              <input className="input" placeholder={w.idDocumentPlaceholder} {...register('idDocumentNumber', requiredText(w.idDocumentRequired))} />
            </Field>
          </section>
        ) : null}

        {step === 1 ? (
          <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="md:col-span-3 text-xs font-semibold text-slate-700">
              {w.deviceInformation}
            </div>
            <SelectField
              label={w.deviceType}
              options={DEVICE_TYPES}
              optionLabels={w.options}
              register={register('deviceType', { required: w.deviceTypeRequired })}
            />
            <Field label={w.brand} error={errors.brand?.message || (errors.brand && w.brandRequired)}>
              <input className="input" placeholder={w.brandPlaceholder} {...register('brand', requiredText(w.brandRequired))} />
            </Field>
            <Field label={w.model} error={errors.model?.message || (errors.model && w.modelRequired)}>
              <input className="input" placeholder={w.modelPlaceholder} {...register('model', requiredText(w.modelRequired))} />
            </Field>
            <Field label={w.imei} error={errors.imei?.message}>
              <input className="input" inputMode="numeric" maxLength={15} placeholder={w.imeiPlaceholder} {...register('imei', imeiValidation)} />
            </Field>
            <Field label={w.serialNumber} error={errors.serialNumber?.message}>
              <input className="input" placeholder={w.serialNumberPlaceholder} {...register('serialNumber', requiredText(w.serialNumberRequired))} />
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
            <Field label={w.storage} error={errors.storage?.message}>
              <input className="input" placeholder={w.storagePlaceholder} {...register('storage', requiredText(w.storageRequired))} />
            </Field>
            <Field label={w.color} error={errors.color?.message}>
              <input className="input" placeholder={w.colorPlaceholder} {...register('color', requiredText(w.colorRequired))} />
            </Field>
            <Field label={w.accessories} error={errors.accessories?.message}>
              <input className="input" placeholder={w.accessoriesPlaceholder} {...register('accessories', requiredText(w.accessoriesRequired))} />
            </Field>
            <Field label={w.batteryHealth} error={errors.batteryHealth?.message}>
              <input className="input" placeholder={w.batteryHealthPlaceholder} {...register('batteryHealth', requiredText(w.batteryHealthRequired))} />
            </Field>
            <Field label={w.damageNotes} error={errors.damageNotes?.message} wide>
              <textarea className="input min-h-20 py-2" placeholder={w.damageNotesPlaceholder} {...register('damageNotes', requiredText(w.damageNotesRequired))} />
            </Field>
            <Field label={w.internalNotes} error={errors.internalNotes?.message} wide>
              <textarea className="input min-h-20 py-2" placeholder={w.internalNotesPlaceholder} {...register('internalNotes', requiredText(w.internalNotesRequired))} />
            </Field>
          </section>
        ) : null}

        {step === 2 ? (
          <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="md:col-span-2 text-xs font-semibold text-slate-700">
              {w.ownershipConfirmations}
            </div>
            {confirmationFields.map(([name, label]) => (
              <label key={name} className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-primary"
                  {...register(name, { required: true })}
                />
                {label} *
              </label>
            ))}
          </section>
        ) : null}

        {step === 3 ? (
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2 text-xs font-semibold text-slate-700">
              {w.photosAndDocuments}
            </div>
            <FileInput label={w.photos.idFront} field="id_front" files={files} saved={savedFileTypes.has('id_front')} onChange={setFile} removeLabel={t.common.remove} savedHint={w.savedUploadReplace} formatHint={w.uploadFormatsLarge} />
            <FileInput label={w.photos.idBack} field="id_back" files={files} saved={savedFileTypes.has('id_back')} onChange={setFile} removeLabel={t.common.remove} savedHint={w.savedUploadReplace} formatHint={w.uploadFormatsLarge} />
            <FileInput label={w.photos.deviceFront} field="device_front" files={files} saved={savedFileTypes.has('device_front')} onChange={setFile} removeLabel={t.common.remove} savedHint={w.savedUploadReplace} formatHint={w.uploadFormatsLarge} />
            <FileInput label={w.photos.deviceBack} field="device_back" files={files} saved={savedFileTypes.has('device_back')} onChange={setFile} removeLabel={t.common.remove} savedHint={w.savedUploadReplace} formatHint={w.uploadFormatsLarge} />
            <FileInput label={w.photos.imeiPhoto} field="imei_photo" files={files} saved={savedFileTypes.has('imei_photo')} onChange={setFile} removeLabel={t.common.remove} savedHint={w.savedUploadReplace} formatHint={w.uploadFormatsLarge} />
            <FileInput label={w.photos.damagePhoto} field="damage_photo" files={files} saved={savedFileTypes.has('damage_photo')} onChange={setFile} removeLabel={t.common.remove} savedHint={w.savedUploadReplace} formatHint={w.uploadFormatsLarge} />
            <FileInput label={w.photos.accessoriesPhoto} field="accessories_photo" files={files} saved={savedFileTypes.has('accessories_photo')} onChange={setFile} removeLabel={t.common.remove} savedHint={w.savedUploadReplace} formatHint={w.uploadFormatsLarge} />
          </section>
        ) : null}

        {step === 4 ? (
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <SignatureBox
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
            <SignatureBox
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
                  [w.review.name, values.customerName],
                  [w.review.phone, values.customerPhone],
                  [w.review.email, values.customerEmail],
                  [w.review.address, values.customerAddress],
                ]}
              />
              <ReviewCard
                title={w.review.device}
                dash={t.common.dash}
                rows={[
                  [w.review.device, [values.brand, values.model].filter(Boolean).join(' ')],
                  [w.review.imeiSerial, values.imei || values.serialNumber],
                  [w.review.condition, values.condition ? optionLabel(values.condition, w.options) : undefined],
                  [w.review.price, values.purchasePrice ? String(values.purchasePrice) : undefined],
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

        <div className="flex flex-col gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={saveDraft}
            className="btn btn-secondary w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-60"
          >
            {w.saveDraft}
          </button>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              disabled={isSubmitting || step === 0}
              onClick={() => setStep((current) => Math.max(0, current - 1))}
              className="btn btn-secondary w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-60"
            >
              {w.back}
            </button>
            {step < steps.length - 1 ? (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={goNext}
                className="btn btn-primary w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-60"
              >
                {w.next}
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? w.saving : w.completeAndPdf}
              </button>
            )}
          </div>
        </div>
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
        accept="image/png,image/svg+xml,.png,.svg"
        className="input py-2"
        onChange={(event) => props.onChange(props.field, event.target.files?.[0] ?? null)}
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
        <div className="h-[180px] overflow-hidden rounded-t-xl bg-white">
          <SignatureCanvas
            ref={props.refSetter}
            onEnd={props.onChange}
            canvasProps={{ className: 'h-[180px] w-full' }}
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
