// Original path: frontend/src/components/contract/ContractWizard.tsx
// Extracted: FormValues type additions + form UI for new contract fields

export type FormValues = {
  salutation?: string
  customerFirstName: string
  customerLastName: string
  customerStreet: string
  customerZipCode: string
  customerCity: string
  idType?: string
  osVersion?: string
  icloudStatus?: string
  mdmStatus?: string
  warranty?: string
  purchaseReceiptAvailable?: boolean
  paymentStatus?: string
  notes?: string
  damageNotes?: string
  internalNotes?: string
  // ...legacy fields...
}

const PAYMENT_STATUSES = ['Paid', 'Pending', 'Partial payment'] as const
const WARRANTY_OPTIONS = ['AppleCare+', 'Manufacturer warranty', 'None'] as const

// Step 0 — customer split: salutation, firstName, lastName, street, zip, city, idType
// Step 1 — device extras: icloudStatus*, mdmStatus, osVersion, warranty, purchaseReceiptAvailable
// Step 1 — purchase: paymentStatus, notes, damageNotes, internalNotes
// Review step displays split name/address and notes

// See full UI in original file lines ~687-955
