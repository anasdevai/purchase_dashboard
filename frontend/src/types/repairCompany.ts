export type RepairCompany = {
  id: string
  name: string
  contactInfo?: string | null
  notes?: string | null
  createdAt: string
  updatedAt: string
}

export type RepairCompanyPayload = {
  name: string
  contactInfo?: string
  notes?: string
}
