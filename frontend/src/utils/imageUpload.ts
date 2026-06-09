export const DOCUMENT_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
] as const

export const DOCUMENT_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'] as const

/** Broad accept list so mobile gallery and camera show all common photos. */
export const DOCUMENT_IMAGE_ACCEPT =
  'image/jpeg,image/png,image/webp,image/*,.jpg,.jpeg,.png,.webp'

export function isAcceptedDocumentImage(file: File): boolean {
  const type = file.type.toLowerCase()
  if (
    type &&
    DOCUMENT_IMAGE_MIME_TYPES.includes(type as (typeof DOCUMENT_IMAGE_MIME_TYPES)[number])
  ) {
    return true
  }

  const name = file.name.toLowerCase()
  return DOCUMENT_IMAGE_EXTENSIONS.some((ext) => name.endsWith(ext))
}
