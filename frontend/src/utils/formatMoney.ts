export function formatMoney(value: number): string {
  const amount = Number.isFinite(value) ? value : 0
  return `€${amount.toFixed(2)}`
}

export function formatWholeMoney(value: number): string {
  const amount = Number.isFinite(value) ? Math.round(value) : 0
  return `€${amount}`
}
