export type RepairCompany = {
  id: string
  name: string
  contactPerson?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  city?: string | null
  country?: string | null
  contactInfo?: string | null
  notes?: string | null
  createdAt: string
  updatedAt: string
}

export type RepairCompanyPayload = {
  name: string
  contactPerson?: string
  phone?: string
  email?: string
  address?: string
  city?: string
  country?: string
  notes?: string
}
