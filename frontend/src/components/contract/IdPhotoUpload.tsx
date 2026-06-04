import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Upload, X } from 'lucide-react'
import clsx from 'clsx'
import { useLanguage } from '../../i18n/LanguageProvider'

const MAX_FILE_SIZE = 5 * 1024 * 1024
const ACCEPTED_MIME_TYPES = ['image/png', 'image/svg+xml'] as const
const ACCEPT_ATTRIBUTE = 'image/png,image/svg+xml,.png,.svg'

function isAcceptedImage(file: File): boolean {
  if (ACCEPTED_MIME_TYPES.includes(file.type as (typeof ACCEPTED_MIME_TYPES)[number])) {
    return true
  }
  const name = file.name.toLowerCase()
  return name.endsWith('.png') || name.endsWith('.svg')
}

type IdPhotoUploadProps = {
  value: File | null
  onChange: (file: File | null) => void
}

export function IdPhotoUpload({ value, onChange }: IdPhotoUploadProps) {
  const { t } = useLanguage()
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const validateAndSet = useCallback(
    (file: File | null) => {
      if (!file) {
        setError(null)
        onChange(null)
        return
      }

      if (!isAcceptedImage(file)) {
        setError(t.contractWizard.idPhotoInvalidType)
        onChange(null)
        return
      }

      if (file.size > MAX_FILE_SIZE) {
        setError(t.contractWizard.idPhotoTooLarge)
        onChange(null)
        return
      }

      setError(null)
      onChange(file)
    },
    [onChange, t.contractWizard.idPhotoInvalidType, t.contractWizard.idPhotoTooLarge],
  )

  useEffect(() => {
    if (!value) {
      setPreviewUrl(null)
      return
    }

    const url = URL.createObjectURL(value)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [value])

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return
    validateAndSet(file)
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (inputRef.current) inputRef.current.value = ''
    validateAndSet(null)
  }

  const openFilePicker = () => inputRef.current?.click()

  return (
    <div>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={ACCEPT_ATTRIBUTE}
        className="sr-only"
        onChange={(e) => {
          handleFiles(e.target.files)
          e.target.value = ''
        }}
      />

      <div
        role="button"
        tabIndex={0}
        onClick={openFilePicker}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            openFilePicker()
          }
        }}
        onDragEnter={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setIsDragging(true)
        }}
        onDragOver={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setIsDragging(true)
        }}
        onDragLeave={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setIsDragging(false)
        }}
        onDrop={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setIsDragging(false)
          handleFiles(e.dataTransfer.files)
        }}
        className={clsx(
          'cursor-pointer rounded-xl border border-dashed bg-slate-50 p-5 text-center transition',
          error
            ? 'border-red-300 bg-red-50/50'
            : isDragging
              ? 'border-primary bg-primary-light/40'
              : 'border-slate-200 hover:border-slate-300',
        )}
        aria-label={t.contractWizard.uploadHint}
      >
        {value && previewUrl ? (
          <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <img
                src={previewUrl}
                alt={value.name}
                className="mx-auto max-h-40 w-full object-contain"
              />
            </div>
            <p className="truncate text-xs font-semibold text-slate-700">{value.name}</p>
            <p className="text-xs text-slate-500">
              {(value.size / 1024).toFixed(1)} KB
            </p>
            <button
              type="button"
              onClick={handleRemove}
              className="btn btn-secondary mx-auto h-8 gap-1.5 px-3 text-xs"
            >
              <X className="h-3.5 w-3.5" />
              {t.contractWizard.removeFile}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                openFilePicker()
              }}
              className="text-xs font-semibold text-primary hover:text-primary-hover"
            >
              {t.contractWizard.replaceFile}
            </button>
          </div>
        ) : (
          <>
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-white ring-1 ring-slate-200">
              <Upload className="h-5 w-5 text-slate-500" />
            </div>
            <div className="mt-3 text-xs font-semibold text-slate-700">
              {t.contractWizard.uploadHint}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              {t.contractWizard.uploadFormats}
            </div>
          </>
        )}
      </div>

      {error ? <p className="mt-1.5 text-xs text-red-600">{error}</p> : null}
    </div>
  )
}
