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
import { useAuth } from '../../auth/AuthContext'
import { loadShopSettings, hasRequiredShopSettings } from '../../services/shopSettings'
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

const deviceTypes = [
  'Smartphone',
  'Tablet',
  'Laptop',
  'Desktop PC',
  'Smartwatch',
  'Gaming console',
  'Other',
]

const conditions = ['Like new', 'Very good', 'Good', 'Used', 'Defective']
const paymentMethods = ['Cash', 'Bank transfer', 'Card', 'Other']
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

const requiredText = (message: string) => ({
  required: message,
  validate: (value?: string) => Boolean(value?.trim()) || message,
})

const imeiValidation = {
  ...requiredText('IMEI is required.'),
  pattern: {
    value: /^\d{15}$/,
    message: 'IMEI must be exactly 15 digits.',
  },
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

export function ContractWizard(props: {
  defaultStep?: number
  compact?: boolean
  initialContract?: ApiContract
}) {
  const { t } = useLanguage()
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

  const steps = useMemo(
    () => [
      t.contractWizard.steps.customerInfo,
      t.contractWizard.steps.deviceInfo,
      t.contractWizard.steps.confirmations,
      t.contractWizard.steps.photos,
      t.contractWizard.steps.signature,
      t.contractWizard.steps.reviewSave,
    ],
    [t],
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
  const title = props.compact
    ? t.contractWizard.titleCompact
    : t.contractWizard.titleFull
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
      setError('Only PNG and SVG document images are allowed.')
      return
    }
    if (file && file.size > maxDocumentUploadMb * 1024 * 1024) {
      setError(`Upload is too large. Maximum size is ${maxDocumentUploadMb}MB per file.`)
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
            ? 'Customer seller signature is required.'
            : 'Shopkeeper buyer signature is required.',
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
      setMessage(`Draft saved: ${draft.contractNumber}`)
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
      setError(err instanceof Error ? err.message : 'Draft could not be saved')
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
        setError(err instanceof Error ? err.message : 'IMEI or serial number already exists.')
        return false
      }
    }

    if (step === 1 && !getValues('imei')?.trim() && !getValues('serialNumber')?.trim()) {
      setError('IMEI and serial number are required.')
      return false
    }

    if (step === 3) {
      const missingFiles = requiredFileFields.filter((field) => !hasRequiredFile(field))
      if (missingFiles.length > 0) {
        setError(`Required uploads missing: ${missingFiles.join(', ')}`)
        return false
      }
    }

    if (step === 4) {
      if (!hasCustomerSignature) {
        setError('Customer seller signature is required.')
        return false
      }
      if (!hasShopkeeperSignature) {
        setError('Shopkeeper buyer signature is required.')
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
      setError('IMEI and serial number are required.')
      setStep(1)
      return
    }

    const missingFiles = requiredFileFields.filter((field) => !hasRequiredFile(field))
    if (missingFiles.length > 0) {
      setError(`Required uploads missing: ${missingFiles.join(', ')}`)
      setStep(3)
      return
    }

    if (!hasCustomerSignature || !hasShopkeeperSignature) {
      setError('Both customer seller and shopkeeper buyer signatures are required.')
      setStep(4)
      return
    }

    if (!user?.id) {
      setError('You must be logged in to complete a contract.')
      return
    }

    const shopSettings = await loadShopSettings(user.id)
    if (!hasRequiredShopSettings(shopSettings)) {
      setError(t.settings.errors.missingForPdf)
      return
    }

    setIsSubmitting(true)
    try {
      const draft = await persistDraft(formValues)
      await uploadSelectedFiles(draft.id)
      await uploadSignatures(draft.id, true)
      const completed = await completeContract(draft.id, {}, shopSettings)
      navigate(`/contracts/${completed.id}`)
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
      setError(err instanceof Error ? err.message : 'Contract could not be completed')
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
              {t.contractWizard.customerInformation}
            </div>
            <Field label={t.contractWizard.fullName} error={errors.customerName?.message || (errors.customerName && t.contractWizard.fullNameRequired)}>
              <input className="input" {...register('customerName', requiredText('Full name is required.'))} />
            </Field>
            <Field label="E-Mail *" error={errors.customerEmail?.message}>
              <input
                className="input"
                type="email"
                {...register('customerEmail', {
                  ...requiredText('Email is required.'),
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Enter a valid email address.',
                  },
                })}
              />
            </Field>
            <Field label={t.contractWizard.phone} error={errors.customerPhone?.message || (errors.customerPhone && t.contractWizard.phoneRequired)}>
              <input className="input" {...register('customerPhone', { ...requiredText('Phone number is required.'), minLength: { value: 5, message: 'Phone number is too short.' } })} />
            </Field>
            <Field label="Date of birth *" error={errors.customerDateOfBirth?.message}>
              <input className="input" type="date" {...register('customerDateOfBirth', requiredText('Date of birth is required.'))} />
            </Field>
            <Field label={t.contractWizard.address} error={errors.customerAddress?.message || (errors.customerAddress && t.contractWizard.addressRequired)} wide>
              <textarea className="input min-h-24 py-2" {...register('customerAddress', requiredText('Address is required.'))} />
            </Field>
            <Field label="ID document number *" error={errors.idDocumentNumber?.message} wide>
              <input className="input" {...register('idDocumentNumber', requiredText('ID document number is required.'))} />
            </Field>
          </section>
        ) : null}

        {step === 1 ? (
          <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="md:col-span-3 text-xs font-semibold text-slate-700">
              Device Information
            </div>
            <SelectField label="Device Type *" options={deviceTypes} register={register('deviceType', { required: 'Device type is required.' })} />
            <Field label="Brand *" error={errors.brand?.message || (errors.brand && 'Brand is required.')}>
              <input className="input" {...register('brand', requiredText('Brand is required.'))} />
            </Field>
            <Field label="Model *" error={errors.model?.message || (errors.model && 'Model is required.')}>
              <input className="input" {...register('model', requiredText('Model is required.'))} />
            </Field>
            <Field label="IMEI *" error={errors.imei?.message}>
              <input className="input" inputMode="numeric" maxLength={15} {...register('imei', imeiValidation)} />
            </Field>
            <Field label="Serial Number *" error={errors.serialNumber?.message}>
              <input className="input" {...register('serialNumber', requiredText('Serial number is required.'))} />
            </Field>
            <SelectField label="Condition *" options={conditions} register={register('condition', { required: 'Condition is required.' })} />
            <Field label="Purchase Price *" error={errors.purchasePrice?.message || (errors.purchasePrice && 'Price must be greater than zero.')}>
              <input className="input" type="number" step="0.01" {...register('purchasePrice', { required: 'Purchase price is required.', min: { value: 0.01, message: 'Price must be greater than zero.' } })} />
            </Field>
            <SelectField label="Payment Method *" options={paymentMethods} register={register('paymentMethod', { required: 'Payment method is required.' })} />
            <Field label="Storage *" error={errors.storage?.message}>
              <input className="input" {...register('storage', requiredText('Storage is required.'))} />
            </Field>
            <Field label="Color *" error={errors.color?.message}>
              <input className="input" {...register('color', requiredText('Color is required.'))} />
            </Field>
            <Field label="Accessories *" error={errors.accessories?.message}>
              <input className="input" {...register('accessories', requiredText('Accessories are required.'))} />
            </Field>
            <Field label="Battery Health *" error={errors.batteryHealth?.message}>
              <input className="input" {...register('batteryHealth', requiredText('Battery health is required.'))} />
            </Field>
            <Field label="Visible Damage Notes *" error={errors.damageNotes?.message} wide>
              <textarea className="input min-h-20 py-2" {...register('damageNotes', requiredText('Visible damage notes are required.'))} />
            </Field>
            <Field label="Internal Notes *" error={errors.internalNotes?.message} wide>
              <textarea className="input min-h-20 py-2" {...register('internalNotes', requiredText('Internal notes are required.'))} />
            </Field>
          </section>
        ) : null}

        {step === 2 ? (
          <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="md:col-span-2 text-xs font-semibold text-slate-700">
              Ownership and Lock Confirmations
            </div>
            {[
              ['ownershipConfirmed', 'Customer confirms ownership of the device'],
              ['notStolenConfirmed', 'Customer confirms the device is not stolen'],
              ['icloudRemoved', 'iCloud lock removed'],
              ['googleLockRemoved', 'Google lock removed'],
              ['otherLockRemoved', 'Samsung / Microsoft / other lock removed'],
              ['factoryResetConfirmed', 'Device has been factory reset'],
            ].map(([name, label]) => (
              <label key={name} className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-primary"
                  {...register(name as keyof FormValues, { required: true })}
                />
                {label} *
              </label>
            ))}
          </section>
        ) : null}

        {step === 3 ? (
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2 text-xs font-semibold text-slate-700">
              Photos and Documents
            </div>
            <FileInput label="ID Card / Passport Photo *" field="id_front" files={files} saved={savedFileTypes.has('id_front')} onChange={setFile} />
            <FileInput label="ID Back Photo *" field="id_back" files={files} saved={savedFileTypes.has('id_back')} onChange={setFile} />
            <FileInput label="Device Front Photo *" field="device_front" files={files} saved={savedFileTypes.has('device_front')} onChange={setFile} />
            <FileInput label="Device Back Photo *" field="device_back" files={files} saved={savedFileTypes.has('device_back')} onChange={setFile} />
            <FileInput label="IMEI / Serial Photo *" field="imei_photo" files={files} saved={savedFileTypes.has('imei_photo')} onChange={setFile} />
            <FileInput label="Damage Photo *" field="damage_photo" files={files} saved={savedFileTypes.has('damage_photo')} onChange={setFile} />
            <FileInput label="Accessories Photo *" field="accessories_photo" files={files} saved={savedFileTypes.has('accessories_photo')} onChange={setFile} />
          </section>
        ) : null}

        {step === 4 ? (
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <SignatureBox
              title="Customer / seller signature *"
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
              title="Shopkeeper / buyer signature *"
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
            <div className="text-xs font-semibold text-slate-700">Check and save</div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <ReviewCard
                title="Customer"
                rows={[
                  ['Name', values.customerName],
                  ['Phone', values.customerPhone],
                  ['Email', values.customerEmail || '-'],
                  ['Address', values.customerAddress],
                ]}
              />
              <ReviewCard
                title="Device"
                rows={[
                  ['Device', [values.brand, values.model].filter(Boolean).join(' ')],
                  ['IMEI / Serial', values.imei || values.serialNumber || '-'],
                  ['Condition', values.condition],
                  ['Price', values.purchasePrice ? String(values.purchasePrice) : '-'],
                ]}
              />
              <ReviewCard
                title="Files and signatures"
                rows={[
                  ['Required files', `${requiredFileFields.filter((field) => hasRequiredFile(field)).length}/${requiredFileFields.length}`],
                  ['Customer signature', hasCustomerSignature ? 'Captured' : 'Missing'],
                  ['Shopkeeper signature', hasShopkeeperSignature ? 'Captured' : 'Missing'],
                  ['PDF', 'Generated after completion'],
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
            Save Draft
          </button>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              disabled={isSubmitting || step === 0}
              onClick={() => setStep((current) => Math.max(0, current - 1))}
              className="btn btn-secondary w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-60"
            >
              Back
            </button>
            {step < steps.length - 1 ? (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={goNext}
                className="btn btn-primary w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-60"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'Saving...' : 'Complete and Generate PDF'}
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
  options: string[]
  register: UseFormRegisterReturn
}) {
  return (
    <Field label={props.label}>
      <select className="input" {...props.register}>
        {props.options.map((option) => (
          <option key={option} value={option}>
            {option}
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
            Remove
          </button>
        </div>
      ) : props.saved ? (
        <div className="mt-1 text-xs font-semibold text-emerald-700">
          Saved upload exists. Choose a new PNG/SVG to replace it.
        </div>
      ) : (
        <div className="mt-1 text-xs text-slate-500">PNG or SVG up to 20MB.</div>
      )}
    </div>
  )
}

function SignatureBox(props: {
  title: string
  refSetter: (ref: SignatureCanvas | null) => void
  onChange: () => void
  onClear: () => void
  saved?: boolean
}) {
  return (
    <div>
      <div className="text-xs font-semibold text-slate-700">{props.title}</div>
      {props.saved ? (
        <div className="mt-1 text-xs font-semibold text-emerald-700">
          Saved signature exists. Draw again only to replace it.
        </div>
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
            Clear
          </button>
        </div>
      </div>
    </div>
  )
}

function ReviewCard(props: { title: string; rows: Array<[string, string | number | undefined]> }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="text-sm font-semibold text-slate-900">{props.title}</div>
      <div className="mt-3 space-y-2 text-sm">
        {props.rows.map(([label, value]) => (
          <div key={label} className="flex items-start justify-between gap-3">
            <span className="text-slate-500">{label}</span>
            <span className="max-w-[60%] text-right font-semibold text-slate-900">
              {value || '-'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
