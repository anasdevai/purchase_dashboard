/**
 * Central device-category to image mapping.
 *
 * Resolves a device category from free-text fields (e.g. a repair order's
 * deviceType/brand/model, or a spare part's name/compatibility) and returns a
 * consistent image stored under `/assets/device-categories/`.
 *
 * Use {@link getDeviceCategoryImage} everywhere a device image is shown so the
 * mapping logic is never duplicated inside components.
 */

const BASE = '/assets/device-categories'

export type DeviceCategory =
  | 'iphone'
  | 'samsung-phone'
  | 'ipad'
  | 'android-tablet'
  | 'macbook'
  | 'windows-laptop'
  | 'playstation'
  | 'xbox'
  | 'nintendo-switch'

export const DEVICE_CATEGORY_IMAGES: Record<DeviceCategory | 'default', string> = {
  iphone: `${BASE}/iphone.png`,
  'samsung-phone': `${BASE}/samsung-phone.png`,
  ipad: `${BASE}/ipad.png`,
  'android-tablet': `${BASE}/android-tablet.png`,
  macbook: `${BASE}/macbook.png`,
  'windows-laptop': `${BASE}/windows-laptop.png`,
  playstation: `${BASE}/playstation.png`,
  xbox: `${BASE}/xbox.png`,
  'nintendo-switch': `${BASE}/nintendo-switch.png`,
  default: `${BASE}/default.png`,
}

/**
 * Ordered matchers: the first pattern that matches wins, so more specific
 * categories (e.g. iPad / Galaxy Tab) must be listed before broader ones
 * (e.g. generic phone / laptop).
 */
const MATCHERS: ReadonlyArray<{ category: DeviceCategory; pattern: RegExp }> = [
  { category: 'nintendo-switch', pattern: /\b(nintendo|switch)\b/ },
  { category: 'xbox', pattern: /\bxbox\b/ },
  { category: 'playstation', pattern: /\b(playstation|ps\s?[345]|psone|psp|vita)\b/ },
  { category: 'ipad', pattern: /\bipad\b/ },
  { category: 'android-tablet', pattern: /\b(galaxy\s?tab|android.*tablet|tablet|surface\s?pro)\b/ },
  { category: 'iphone', pattern: /\biphone\b/ },
  { category: 'samsung-phone', pattern: /\b(samsung|galaxy|pixel|android)\b/ },
  { category: 'macbook', pattern: /\b(macbook|imac|mac\s?(mini|pro|studio|book)?)\b/ },
  {
    category: 'windows-laptop',
    pattern: /\b(windows|laptop|notebook|ultrabook|thinkpad|lenovo|dell|hp|asus|acer|msi|surface)\b/,
  },
]

/**
 * Infer a device category from one or more free-text fields.
 * Returns `'default'` when nothing matches.
 */
export function resolveDeviceCategory(
  ...fields: Array<string | null | undefined>
): DeviceCategory | 'default' {
  const text = fields.filter(Boolean).join(' ').toLowerCase().trim()
  if (!text) return 'default'

  for (const { category, pattern } of MATCHERS) {
    if (pattern.test(text)) return category
  }
  return 'default'
}

/**
 * Resolve the image source for a device based on free-text fields.
 * Falls back to a generic device image when the category is unknown.
 */
export function getDeviceCategoryImage(
  ...fields: Array<string | null | undefined>
): string {
  return DEVICE_CATEGORY_IMAGES[resolveDeviceCategory(...fields)]
}
