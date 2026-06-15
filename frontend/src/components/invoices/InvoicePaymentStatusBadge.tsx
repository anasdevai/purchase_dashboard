import { useLanguage } from '../../i18n/LanguageProvider'
import type { InvoicePaymentStatus } from '../../types/invoice'
import { invoicePaymentStatusBadgeClass } from './invoicePaymentStatusStyles'

export function InvoicePaymentStatusBadge(props: {
  status: InvoicePaymentStatus
  testId?: string
}) {
  const { t } = useLanguage()

  return (
    <span className={invoicePaymentStatusBadgeClass(props.status)} data-testid={props.testId}>
      {t.invoices.paymentStatuses[props.status]}
    </span>
  )
}
