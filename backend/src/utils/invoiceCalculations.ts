export const roundWhole = (value: number) => Math.round(value);

export type InvoiceLineInput = {
  description: string;
  quantity: number;
  unitPrice: number;
  vatPercent: number;
};

export const calculateInvoiceLine = (
  item: Pick<InvoiceLineInput, "quantity" | "unitPrice" | "vatPercent">
) => {
  const lineGross = roundWhole(item.quantity * item.unitPrice);
  const lineNet =
    item.vatPercent > 0 ? roundWhole(lineGross / (1 + item.vatPercent / 100)) : lineGross;
  const lineVat = lineGross - lineNet;

  return {
    lineNet,
    lineVat,
    lineTotal: lineGross
  };
};

export const calculateInvoiceItems = (items: InvoiceLineInput[]) => {
  let calculatedNetAmount = 0;
  let calculatedVatAmount = 0;
  let calculatedGrossTotal = 0;

  const preparedItems = items.map((item, index) => {
    const { lineNet, lineVat, lineTotal } = calculateInvoiceLine(item);
    calculatedNetAmount += lineNet;
    calculatedVatAmount += lineVat;
    calculatedGrossTotal += lineTotal;

    return {
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      vatPercent: item.vatPercent,
      lineNet,
      lineVat,
      lineTotal,
      sortOrder: index
    };
  });

  calculatedNetAmount = roundWhole(calculatedNetAmount);
  calculatedVatAmount = roundWhole(calculatedVatAmount);
  calculatedGrossTotal = roundWhole(calculatedGrossTotal);

  return {
    preparedItems,
    calculatedNetAmount,
    calculatedVatAmount,
    calculatedGrossTotal
  };
};
