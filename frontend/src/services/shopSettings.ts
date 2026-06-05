import { fetchShopSettings, saveShopSettingsApi, type ShopSettingsPayload } from '../api/settings'

export const DEFAULT_SHOP_NAME = 'Sceleria'
export const DEFAULT_SHOP_ADDRESS = 'Your shop address'
export const DEFAULT_SHOP_PHONE = 'Your shop phone'
export const DEFAULT_SHOP_EMAIL = 'Your shop email'
export const DEFAULT_OWNER_NAME = 'Your owner / manager name'

export type ShopSettings = {
  shopName: string
  shopAddress: string
  shopPhone: string
  shopEmail: string
  ownerName: string
  logoDataUrl?: string
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

export const defaultShopSettings = (): ShopSettings => ({
  shopName: DEFAULT_SHOP_NAME,
  shopAddress: '',
  shopPhone: '',
  shopEmail: '',
  ownerName: '',
})

function isShopSettings(value: unknown): value is ShopSettings {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return (
    typeof record.shopName === 'string' &&
    typeof record.shopAddress === 'string' &&
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
  const saved = await saveShopSettingsApi(settings)
  saveShopSettingsToCache(userId, saved)
  return saved
}

export function clearUserLocalData(userId?: string) {
  if (userId) {
    localStorage.removeItem(storageKeyForUser(userId))
    return
  }

  Object.keys(localStorage)
    .filter((key) => key.startsWith('purchase-dashboard.'))
    .forEach((key) => localStorage.removeItem(key))
}

export type ShopSettingsValidationErrors = Partial<Record<'shopEmail', string>>

export function validateShopSettings(settings: ShopSettings): ShopSettingsValidationErrors {
  const errors: ShopSettingsValidationErrors = {}
  const email = settings.shopEmail.trim()
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.shopEmail = 'invalid'
  }
  return errors
}

export function shopSettingsForPdf(settings: ShopSettings): ShopSettingsPayload {
  return {
    shopName: settings.shopName.trim(),
    shopAddress: settings.shopAddress.trim(),
    shopPhone: settings.shopPhone.trim(),
    shopEmail: settings.shopEmail.trim(),
    ownerName: settings.ownerName.trim() || undefined,
    logoDataUrl: settings.logoDataUrl,
  }
}
