import { apiRequest } from './client'

export type ShopSettingsPayload = {
  shopName: string
  shopAddress?: string
  street: string
  zipCode: string
  city: string
  country: string
  shopPhone: string
  shopEmail: string
  website: string
  ownerName?: string
  vatNumber: string
  companyRegistrationNumber: string
  taxNumber: string
  accountHolder: string
  iban: string
  bicSwift: string
  bankName: string
  defaultVatRate: string
  defaultVatCustom: string
  logoDataUrl?: string
  widgetPrimaryColor?: string
  widgetAccentColor?: string
  widgetFont?: string
  widgetShowLogo?: boolean
}

type ShopSettingsResponse = {
  settings: ShopSettingsPayload
}

function mapSettings(settings: ShopSettingsPayload) {
  return {
    shopName: settings.shopName ?? '',
    shopAddress: settings.shopAddress ?? '',
    street: settings.street ?? '',
    zipCode: settings.zipCode ?? '',
    city: settings.city ?? '',
    country: settings.country ?? '',
    shopPhone: settings.shopPhone ?? '',
    shopEmail: settings.shopEmail ?? '',
    website: settings.website ?? '',
    ownerName: settings.ownerName ?? '',
    vatNumber: settings.vatNumber ?? '',
    companyRegistrationNumber: settings.companyRegistrationNumber ?? '',
    taxNumber: settings.taxNumber ?? '',
    accountHolder: settings.accountHolder ?? '',
    iban: settings.iban ?? '',
    bicSwift: settings.bicSwift ?? '',
    bankName: settings.bankName ?? '',
    defaultVatRate: settings.defaultVatRate ?? '20',
    defaultVatCustom: settings.defaultVatCustom ?? '',
    logoDataUrl: settings.logoDataUrl,
    widgetPrimaryColor: settings.widgetPrimaryColor ?? '#0284c7',
    widgetAccentColor: settings.widgetAccentColor ?? '#0f172a',
    widgetFont: settings.widgetFont ?? 'Inter',
    widgetShowLogo: settings.widgetShowLogo ?? true,
  }
}

export async function fetchShopSettings() {
  const response = await apiRequest<ShopSettingsResponse>('/api/settings')
  return mapSettings(response.settings)
}

export async function saveShopSettingsApi(settings: ShopSettingsPayload) {
  const response = await apiRequest<ShopSettingsResponse>('/api/settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  })
  return mapSettings(response.settings)
}
