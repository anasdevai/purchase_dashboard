import { apiRequest } from './client'

export type ShopSettingsPayload = {
  shopName: string
  shopAddress: string
  shopPhone: string
  shopEmail: string
  ownerName?: string
  logoDataUrl?: string
}

type ShopSettingsResponse = {
  settings: ShopSettingsPayload
}

export async function fetchShopSettings() {
  const response = await apiRequest<ShopSettingsResponse>('/api/settings')
  return {
    shopName: response.settings.shopName ?? '',
    shopAddress: response.settings.shopAddress ?? '',
    shopPhone: response.settings.shopPhone ?? '',
    shopEmail: response.settings.shopEmail ?? '',
    ownerName: response.settings.ownerName ?? '',
    logoDataUrl: response.settings.logoDataUrl,
  }
}

export async function saveShopSettingsApi(settings: ShopSettingsPayload) {
  const response = await apiRequest<ShopSettingsResponse>('/api/settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  })
  return {
    shopName: response.settings.shopName ?? '',
    shopAddress: response.settings.shopAddress ?? '',
    shopPhone: response.settings.shopPhone ?? '',
    shopEmail: response.settings.shopEmail ?? '',
    ownerName: response.settings.ownerName ?? '',
    logoDataUrl: response.settings.logoDataUrl,
  }
}
