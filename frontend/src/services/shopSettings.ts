import { fetchShopSettings, saveShopSettingsApi, type ShopSettingsPayload } from '../api/settings'

export const DEFAULT_SHOP_NAME = 'Sceleria'
export const DEFAULT_SHOP_ADDRESS = 'Your shop address'
export const DEFAULT_SHOP_PHONE = 'Your shop phone'
export const DEFAULT_SHOP_EMAIL = 'Your shop email'
export const DEFAULT_OWNER_NAME = 'Your owner / manager name'

export type ShopSettings = {
  shopName: string
  shopAddress: string
  street: string
  zipCode: string
  city: string
  country: string
  shopPhone: string
  shopEmail: string
  website: string
  ownerName: string
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
  widgetPrimaryColor: string
  widgetAccentColor: string
  widgetFont: string
  widgetShowLogo: boolean
}

const storageKeyForUser = (userId: string) => `purchase-dashboard.shop-settings.${userId}`

export function resolveShopName(shopName: string): string {
  return shopName.trim() || DEFAULT_SHOP_NAME
}

export function resolveShopAddress(shopAddress: string): string {
  return shopAddress.trim() || DEFAULT_SHOP_ADDRESS
}

export function resolveShopPhone(shopPhone: string): string {
  return shopPhone.trim() || DEFAULT_SHOP_PHONE
}

export function resolveShopEmail(shopEmail: string): string {
  return shopEmail.trim() || DEFAULT_SHOP_EMAIL
}

export function resolveOwnerName(ownerName: string): string {
  return ownerName.trim() || DEFAULT_OWNER_NAME
}

export function formatShopAddress(settings: Pick<ShopSettings, 'street' | 'zipCode' | 'city' | 'country' | 'shopAddress'>) {
  const street = settings.street.trim()
  const zipCode = settings.zipCode.trim()
  const city = settings.city.trim()
  const country = settings.country.trim()

  if (street || zipCode || city || country) {
    const line2 = [zipCode, city].filter(Boolean).join(' ')
    return [street, line2, country].filter(Boolean).join('\n')
  }

  return settings.shopAddress.trim()
}

export const defaultShopSettings = (): ShopSettings => ({
  shopName: '',
  shopAddress: '',
  street: '',
  zipCode: '',
  city: '',
  country: '',
  shopPhone: '',
  shopEmail: '',
  website: '',
  ownerName: '',
  vatNumber: '',
  companyRegistrationNumber: '',
  taxNumber: '',
  accountHolder: '',
  iban: '',
  bicSwift: '',
  bankName: '',
  defaultVatRate: '20',
  defaultVatCustom: '',
  widgetPrimaryColor: '#0284c7',
  widgetAccentColor: '#0f172a',
  widgetFont: 'Inter',
  widgetShowLogo: true
})

export function getDefaultVatPercent(settings: ShopSettings): string {
  if (settings.defaultVatRate === 'custom') {
    const custom = settings.defaultVatCustom.trim()
    return custom || '20'
  }
  return settings.defaultVatRate || '20'
}

export function makeEmptyInvoiceItem(settings: ShopSettings) {
  return {
    description: '',
    quantity: '1',
    unitPrice: '0',
    vatPercent: getDefaultVatPercent(settings),
  }
}

function isShopSettings(value: unknown): value is ShopSettings {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return (
    typeof record.shopName === 'string' &&
    typeof record.shopPhone === 'string' &&
    typeof record.shopEmail === 'string' &&
    typeof record.ownerName === 'string' &&
    (record.logoDataUrl === undefined || typeof record.logoDataUrl === 'string')
  )
}

export function getShopSettingsFromCache(userId: string): ShopSettings {
  try {
    const raw = localStorage.getItem(storageKeyForUser(userId))
    if (!raw) return defaultShopSettings()
    const parsed: unknown = JSON.parse(raw)
    if (!isShopSettings(parsed)) return defaultShopSettings()
    return { ...defaultShopSettings(), ...parsed }
  } catch {
    return defaultShopSettings()
  }
}

export function saveShopSettingsToCache(userId: string, settings: ShopSettings): void {
  localStorage.setItem(storageKeyForUser(userId), JSON.stringify(settings))
}

export async function loadShopSettings(userId: string): Promise<ShopSettings> {
  try {
    const settings = await fetchShopSettings()
    saveShopSettingsToCache(userId, settings)
    return settings
  } catch {
    return getShopSettingsFromCache(userId)
  }
}

export async function saveShopSettings(userId: string, settings: ShopSettings): Promise<ShopSettings> {
  const saved = await saveShopSettingsApi(shopSettingsForPdf(settings))
  saveShopSettingsToCache(userId, saved)
  return saved
}

export function clearUserLocalData(userId?: string) {
  if (userId) {
    localStorage.removeItem(storageKeyForUser(userId))
    localStorage.removeItem(`purchase-dashboard.shop-settings-extended.${userId}`)
    return
  }

  Object.keys(localStorage)
    .filter((key) => key.startsWith('purchase-dashboard.'))
    .forEach((key) => localStorage.removeItem(key))
}

export type ShopSettingsValidationErrors = Partial<
  Record<'shopEmail' | 'defaultVatCustom', 'invalid' | 'required'>
>

export function validateShopSettings(settings: ShopSettings): ShopSettingsValidationErrors {
  const errors: ShopSettingsValidationErrors = {}
  const email = settings.shopEmail.trim()
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.shopEmail = 'invalid'
  }

  if (settings.defaultVatRate === 'custom') {
    const custom = settings.defaultVatCustom.trim()
    const parsed = Number(custom)
    if (!custom || !Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
      errors.defaultVatCustom = 'invalid'
    }
  }

  return errors
}

export function shopSettingsForPdf(settings: ShopSettings): ShopSettingsPayload {
  return {
    shopName: settings.shopName.trim(),
    shopAddress: formatShopAddress(settings),
    street: settings.street.trim(),
    zipCode: settings.zipCode.trim(),
    city: settings.city.trim(),
    country: settings.country.trim(),
    shopPhone: settings.shopPhone.trim(),
    shopEmail: settings.shopEmail.trim(),
    website: settings.website.trim(),
    ownerName: settings.ownerName.trim() || undefined,
    vatNumber: settings.vatNumber.trim(),
    companyRegistrationNumber: settings.companyRegistrationNumber.trim(),
    taxNumber: settings.taxNumber.trim(),
    accountHolder: settings.accountHolder.trim(),
    iban: settings.iban.trim(),
    bicSwift: settings.bicSwift.trim(),
    bankName: settings.bankName.trim(),
    defaultVatRate: settings.defaultVatRate,
    defaultVatCustom: settings.defaultVatRate === 'custom' ? settings.defaultVatCustom.trim() : '',
    logoDataUrl: settings.logoDataUrl,
    widgetPrimaryColor: settings.widgetPrimaryColor,
    widgetAccentColor: settings.widgetAccentColor,
    widgetFont: settings.widgetFont,
    widgetShowLogo: settings.widgetShowLogo,
  }
}
