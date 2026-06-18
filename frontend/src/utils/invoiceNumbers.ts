export function digitsOnly(raw: string): string {
  const trimmed = raw.trim()
  const hasMinus = trimmed.startsWith('-')
  const digits = trimmed.replace(/\D/g, '')
  return hasMinus && digits ? `-${digits}` : digits
}

export function parseWholeNumber(raw: string | number | undefined, fallback = 0): number {
  if (typeof raw === 'number') {
    return Number.isFinite(raw) ? Math.trunc(raw) : fallback
  }
  if (typeof raw === 'string') {
    const parsed = Number.parseInt(digitsOnly(raw), 10)
    return Number.isFinite(parsed) ? parsed : fallback
  }
  return fallback
}

export function normalizeQuantityInput(raw: string): string {
  const digits = digitsOnly(raw)
  if (!digits) return ''
  // Quantity must be at least 1 and positive
  const parsed = Number.parseInt(digits, 10)
  return String(Math.max(1, Number.isNaN(parsed) ? 1 : parsed))
}

export function normalizeWholeInput(raw: string): string {
  const digits = digitsOnly(raw)
  if (!digits || digits === '-') return ''
  const parsed = Number.parseInt(digits, 10)
  return Number.isNaN(parsed) ? '' : String(parsed)
}
