import { apiRequest } from './client'

export type Customer = {
  id: string
  userId: string
  name: string
  phone: string
  email?: string | null
  address?: string | null
  createdAt: string
}

export type CustomerPayload = {
  name: string
  phone: string
  email?: string
  address?: string
}

export async function searchCustomers(query: string): Promise<Customer[]> {
  const response = await apiRequest<{ customers: Customer[] }>(
    `/api/customers/search?q=${encodeURIComponent(query)}`
  )
  return response.customers
}

export async function createCustomer(payload: CustomerPayload): Promise<Customer> {
  const response = await apiRequest<{ customer: Customer }>('/api/customers', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return response.customer
}
