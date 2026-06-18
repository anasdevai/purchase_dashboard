# Original paths: frontend/src/i18n/types.ts, locales/en.ts, locales/de.ts
# Extracted: strings for new contract + invoice fields

## Contract wizard — customer split
- salutation, salutationPlaceholder
- firstName, lastName, street, zipCode, city (+ placeholders & required messages)
- idType, idTypePlaceholder

## Contract wizard — device extras
- icloudStatus, icloudStatusPlaceholder, icloudStatusRequired
- mdmStatus, mdmStatusPlaceholder
- osVersion, osVersionPlaceholder
- warranty, warrantyPlaceholder
- purchaseReceiptAvailable

## Contract wizard — purchase / notes
- paymentStatus, paymentStatusPlaceholder
- notes, notesPlaceholder
- damageNotes, internalNotes (+ placeholders)

## Invoice detail
- paymentStatus, notes, notesPlaceholder, notesHelper
- paymentStatuses: { Paid, Open, Cancelled }

See `frontend/src/i18n/locales/en.ts` and `de.ts` for full translations.
