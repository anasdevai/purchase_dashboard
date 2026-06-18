const MONTH_NAME_TO_NUMBER: Record<string, number> = {
  january: 1,
  jan: 1,
  januar: 1,
  february: 2,
  feb: 2,
  februar: 2,
  march: 3,
  mar: 3,
  märz: 3,
  maerz: 3,
  april: 4,
  apr: 4,
  may: 5,
  mai: 5,
  june: 6,
  jun: 6,
  juni: 6,
  july: 7,
  jul: 7,
  juli: 7,
  august: 8,
  aug: 8,
  september: 9,
  sep: 9,
  sept: 9,
  october: 10,
  oct: 10,
  oktober: 10,
  okt: 10,
  november: 11,
  nov: 11,
  december: 12,
  dec: 12,
  dezember: 12,
  dez: 12,
}

function pad2(value: number) {
  return String(value).padStart(2, '0')
}

function normalizeMonthToken(token: string) {
  return token
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
}

function isValidDateParts(year: number, month: number, day: number) {
  if (year < 1000 || year > 9999) return false
  if (month < 1 || month > 12) return false
  if (day < 1 || day > 31) return false

  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
}

function toIsoDate(year: number, month: number, day: number): string | null {
  if (!isValidDateParts(year, month, day)) return null
  return `${year}-${pad2(month)}-${pad2(day)}`
}

function parseWrittenDate(value: string): string | null {
  const match = value.match(/^(\d{1,2})[.\s-]+([A-Za-zÀ-ÿ]+)[.\s-]+(\d{4})$/i)
  if (!match) return null

  const day = Number(match[1])
  const month = MONTH_NAME_TO_NUMBER[normalizeMonthToken(match[2])]
  const year = Number(match[3])
  if (!month) return null

  return toIsoDate(year, month, day)
}

export function parseOcrDateToIso(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (isoMatch) {
    const year = Number(isoMatch[1])
    const month = Number(isoMatch[2])
    const day = Number(isoMatch[3])
    return isValidDateParts(year, month, day) ? `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}` : null
  }

  const ymdSlashMatch = trimmed.match(/^(\d{4})[/.-](\d{1,2})[/.-](\d{1,2})$/)
  if (ymdSlashMatch) {
    return toIsoDate(Number(ymdSlashMatch[1]), Number(ymdSlashMatch[2]), Number(ymdSlashMatch[3]))
  }

  const dotMatch = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
  if (dotMatch) {
    return toIsoDate(Number(dotMatch[3]), Number(dotMatch[2]), Number(dotMatch[1]))
  }

  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (slashMatch) {
    const first = Number(slashMatch[1])
    const second = Number(slashMatch[2])
    const year = Number(slashMatch[3])
    if (first > 12) return toIsoDate(year, second, first)
    if (second > 12) return toIsoDate(year, first, second)
    return toIsoDate(year, second, first)
  }

  const dashMatch = trimmed.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/)
  if (dashMatch) {
    return toIsoDate(Number(dashMatch[3]), Number(dashMatch[2]), Number(dashMatch[1]))
  }

  return parseWrittenDate(trimmed)
}
