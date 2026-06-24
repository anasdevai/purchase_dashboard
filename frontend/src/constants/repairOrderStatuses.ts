import type { RepairOrderStatus } from '../types/repairOrder'

export const REPAIR_ORDER_STATUSES = [
  'Open',
  'WorkPending',
  'SentToRepairCompany',
  'AppointmentScheduled',
  'SparePartArrived',
  'Completed',
  'Cancelled',
] as const satisfies readonly RepairOrderStatus[]

export const ACTIVE_REPAIR_ORDER_STATUSES = [
  'Open',
  'WorkPending',
  'SentToRepairCompany',
  'AppointmentScheduled',
  'SparePartArrived',
] as const satisfies readonly RepairOrderStatus[]

export type RepairOrderListFilter = 'active' | RepairOrderStatus

export const REPAIR_ORDER_LIST_FILTERS: RepairOrderListFilter[] = [
  'active',
  'Open',
  'WorkPending',
  'SentToRepairCompany',
  'AppointmentScheduled',
  'Completed',
]
