import { apiRequest } from './client'
import type { RepairCompany, RepairCompanyPayload } from '../types/repairCompany'

type RepairCompanyResponse = { repairCompany: RepairCompany }
type RepairCompanyListResponse = { repairCompanies: RepairCompany[] }

export async function fetchRepairCompanies() {
  const response = await apiRequest<RepairCompanyListResponse>('/api/repair-companies')
  return response.repairCompanies
}

export async function createRepairCompany(payload: RepairCompanyPayload) {
  const response = await apiRequest<RepairCompanyResponse>('/api/repair-companies', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return response.repairCompany
}

export async function updateRepairCompany(id: string, payload: RepairCompanyPayload) {
  const response = await apiRequest<RepairCompanyResponse>(`/api/repair-companies/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  return response.repairCompany
}

export async function deleteRepairCompany(id: string) {
  return apiRequest(`/api/repair-companies/${id}`, { method: 'DELETE' })
}
