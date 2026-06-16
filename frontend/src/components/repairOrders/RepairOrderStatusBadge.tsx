import { useLanguage } from '../../i18n/LanguageProvider'
import type { RepairOrderStatus } from '../../types/repairOrder'
import { repairOrderStatusBadgeClass } from './repairOrderStatusStyles'

export function RepairOrderStatusBadge(props: {
  status: RepairOrderStatus
  testId?: string
}) {
  const { t } = useLanguage()

  return (
    <span className={repairOrderStatusBadgeClass(props.status)} data-testid={props.testId}>
      {t.repairOrders.statuses[props.status]}
    </span>
  )
}
