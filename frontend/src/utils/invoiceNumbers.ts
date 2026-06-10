export function digitsOnly(raw: string): string {
  return raw.replace(/\D/g, '')
}

export function parseWholeNumber(raw: string | number | undefined, fallback = 0): number {
  if (typeof raw === 'number') {
    return Number.isFinite(raw) ? Math.trunc(raw) : fallback
  }
  const parsed = Number.parseInt(digitsOnly(raw ?? ''), 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function normalizeQuantityInput(raw: string): string {
  const digits = digitsOnly(raw)
  if (!digits) return ''
  return String(Math.max(1, Number.parseInt(digits, 10)))
}

export function normalizeWholeInput(raw: string): string {
  const digits = digitsOnly(raw)
  if (!digits) return ''
  return String(Number.parseInt(digits, 10))
}
