// Original path: frontend/src/api/contracts.ts
// Extracted: QR signature API client functions

export async function generateSignatureQr(id: string) {
  return apiRequest<{ token: string; status: string; qrUrl?: string | null }>(`/api/contracts/${id}/signature-qr`, {
    method: 'POST',
  })
}

export async function fetchSignatureStatus(id: string) {
  return apiRequest<{ status: string; token: string | null }>(`/api/contracts/${id}/signature-status`)
}

export async function fetchSignatureContract(token: string) {
  const response = await apiRequest<{ contract: ApiContract }>(`/api/contracts/public/signature/${token}`)
  return response.contract
}

export async function submitSignatureByToken(token: string, signature: Blob) {
  const formData = new FormData()
  formData.append('signature', signature, 'signature.png')
  return apiRequest<{ success: true; status: string }>(`/api/contracts/public/signature/${token}`, {
    method: 'POST',
    body: formData,
  })
}

// Depends on: apiRequest, ApiContract from ../types/contract
