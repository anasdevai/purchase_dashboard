export const roundWhole = (value: number) => Math.round(value)

export type InvoiceLineInput = {
  quantity: number
  unitPrice: number
  vatPercent: number
}

export const calculateInvoiceLine = (item: InvoiceLineInput) => {
  const lineGross = roundWhole(item.quantity * item.unitPrice)
  const lineNet =
    item.vatPercent > 0 ? roundWhole(lineGross / (1 + item.vatPercent / 100)) : lineGross
  const lineVat = lineGross - lineNet

  return {
    lineNet,
    lineVat,
    lineGross,
  }
}

export const calculateInvoiceTotals = (items: InvoiceLineInput[]) => {
  return items.reduce(
    (totals, item) => {
      const line = calculateInvoiceLine(item)
      return {
        net: totals.net + line.lineNet,
        vat: totals.vat + line.lineVat,
        gross: totals.gross + line.lineGross,
      }
    },
    { net: 0, vat: 0, gross: 0 },
  )
}
