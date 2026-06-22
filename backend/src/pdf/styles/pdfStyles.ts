export const getPdfStyles = () => `
  @page {
    size: A4;
    margin: 12mm 12mm 14mm 12mm;
  }

  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  html, body {
    margin: 0;
    padding: 0;
  }

  .pdf-body {
    font-family: Helvetica, Arial, "Segoe UI", sans-serif;
    font-size: 9pt;
    line-height: 1.35;
    color: #111827;
    background: #ffffff;
  }

  .pdf-page {
    width: 100%;
    max-width: 186mm;
    margin: 0 auto;
  }

  .avoid-break {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .page-break {
    page-break-before: always;
    break-before: page;
  }

  .divider {
    border: 0;
    border-top: 1px solid #dbe3ef;
    margin: 10px 0 12px;
  }

  .doc-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
  }

  .doc-header__left {
    flex: 0 0 auto;
  }

  .doc-header__right {
    flex: 1 1 auto;
    text-align: right;
    min-width: 0;
  }

  .logo {
    display: block;
    max-width: 88px;
    max-height: 62px;
    width: auto;
    height: auto;
    object-fit: contain;
  }

  .logo--large {
    max-width: 140px;
    max-height: 100px;
    width: auto;
    height: auto;
    object-fit: contain;
  }

  .logo--contract {
    width: 150px;
    max-width: 160px;
    max-height: 115px;
    height: auto;
    object-fit: contain;
  }

  .doc-header--contract {
    gap: 24px;
    align-items: flex-start;
  }

  .doc-header--contract .doc-header__left {
    flex: 0 0 160px;
    max-width: 160px;
    padding-right: 8px;
  }

  .doc-header--contract .doc-header__right {
    flex: 1 1 auto;
    min-width: 0;
    padding-left: 4px;
  }

  .logo--compact {
    max-width: 72px;
    max-height: 50px;
  }

  .logo--placeholder {
    width: 72px;
    height: 50px;
  }

  .logo--placeholder.logo--large {
    width: 140px;
    height: 100px;
  }

  .logo--placeholder.logo--contract {
    width: 150px;
    height: 115px;
  }

  .doc-meta-block {
    margin-bottom: 8px;
  }

  .meta-label {
    font-size: 7pt;
    font-weight: 700;
    color: #64748b;
    text-transform: none;
  }

  .meta-value {
    font-size: 9pt;
    margin-bottom: 4px;
  }

  .company-details {
    font-size: 8pt;
    line-height: 1.4;
  }

  .company-name {
    font-size: 11pt;
    font-weight: 700;
    margin-bottom: 2px;
  }

  .doc-title {
    font-size: 14pt;
    font-weight: 700;
    margin: 4px 0 12px;
    letter-spacing: 0.02em;
  }

  .doc-title--center {
    text-align: center;
    font-size: 12pt;
    margin: 8px 0 14px;
  }

  .section {
    margin-bottom: 12px;
  }

  .section-title {
    font-size: 8.5pt;
    font-weight: 700;
    margin: 0 0 8px;
    padding-bottom: 4px;
    border-bottom: 1px solid #dbe3ef;
  }

  .section-subtitle {
    font-size: 7.5pt;
    font-weight: 700;
    color: #64748b;
    margin: 0 0 6px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .meta-lines {
    margin: 0 0 12px;
  }

  .meta-line {
    margin: 2px 0;
    font-size: 8.5pt;
  }

  .meta-line strong {
    display: inline-block;
    min-width: 110px;
  }

  .subject-line {
    font-size: 10pt;
    font-weight: 700;
    margin: 8px 0 12px;
    padding: 8px 0;
    border-top: 1px solid #dbe3ef;
    border-bottom: 1px solid #dbe3ef;
  }

  .kv-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 16px;
  }

  .kv-item {
    width: 100%;
    display: flex;
    gap: 8px;
    font-size: 8pt;
    line-height: 1.35;
  }

  .kv-item--half {
    width: calc(50% - 8px);
  }

  .kv-label {
    flex: 0 0 auto;
    min-width: 72px;
    font-weight: 700;
    color: #64748b;
  }

  .kv-value {
    flex: 1 1 auto;
    min-width: 0;
    word-break: break-word;
  }

  .kv-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 8pt;
  }

  .kv-table th {
    text-align: left;
    font-weight: 700;
    color: #111827;
    padding: 2px 12px 2px 0;
    vertical-align: top;
    white-space: nowrap;
    width: 90px;
  }

  .kv-table td {
    padding: 2px 0;
    vertical-align: top;
  }

  .data-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 7.5pt;
    margin: 8px 0 12px;
  }

  .data-table thead th {
    text-align: left;
    font-weight: 700;
    padding: 6px 4px;
    border-bottom: 1px solid #dbe3ef;
    white-space: nowrap;
  }

  .data-table tbody td {
    padding: 5px 4px;
    border-bottom: 1px solid #eef2f7;
    vertical-align: top;
  }

  .data-table .num {
    text-align: right;
    white-space: nowrap;
  }

  .data-table .pos {
    width: 28px;
  }

  .totals-block {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 20px;
    margin-top: 8px;
  }

  .vat-breakdown {
    flex: 1 1 auto;
    font-size: 8pt;
    color: #64748b;
  }

  .vat-breakdown__title {
    font-weight: 700;
    color: #111827;
    margin-bottom: 6px;
  }

  .vat-breakdown__line {
    margin: 3px 0;
  }

  .totals-panel {
    flex: 0 0 180px;
    border: 1px solid #dbe3ef;
    border-radius: 6px;
    padding: 10px 12px;
    background: #f8fafc;
  }

  .totals-row {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    margin: 4px 0;
    font-size: 8pt;
  }

  .totals-row--gross {
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid #dbe3ef;
    font-size: 10pt;
    font-weight: 700;
  }

  .panel {
    border: 1px solid #dbe3ef;
    border-radius: 6px;
    padding: 12px 14px;
    background: #ffffff;
    margin-bottom: 12px;
  }

  .panel--highlight {
    background: #f8fafc;
  }

  .panel__title {
    font-size: 8.5pt;
    font-weight: 700;
    margin: 0 0 10px;
  }

  .panel__row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 12px;
    margin: 4px 0;
    font-size: 8pt;
  }

  .panel__amount {
    font-size: 16pt;
    font-weight: 700;
    text-align: right;
  }

  .two-col {
    display: flex;
    gap: 12px;
    align-items: stretch;
  }

  .two-col > .panel {
    flex: 1 1 0;
    margin-bottom: 0;
  }

  .check-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .check-list li {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 5px 0;
    font-size: 7.5pt;
  }

  .check-icon {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 7pt;
    font-weight: 700;
    color: #ffffff;
    flex-shrink: 0;
  }

  .check-icon--yes {
    background: #16a34a;
  }

  .check-icon--no {
    background: #cbd5e1;
    color: transparent;
  }

  .photo-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-top: 8px;
  }

  .photo-thumb {
    width: 100%;
    height: 72px;
    border: 1px solid #dbe3ef;
    border-radius: 4px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #ffffff;
  }

  .photo-thumb img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }

  .photo-thumb__label {
    font-size: 6.5pt;
    color: #64748b;
    text-align: center;
    padding: 4px;
  }

  .signature-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-top: 10px;
  }

  .signature-box {
    min-height: 72px;
    border: 1px solid #dbe3ef;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background: #ffffff;
  }

  .signature-box img {
    max-width: 100%;
    max-height: 68px;
    object-fit: contain;
  }

  .signature-meta {
    display: flex;
    justify-content: space-between;
    margin-top: 6px;
    font-size: 7pt;
  }

  .signature-line-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin-top: 12px;
  }

  .signature-line {
    border-top: 1px solid #dbe3ef;
    padding-top: 4px;
    font-size: 7pt;
    color: #64748b;
  }

  .notes-block {
    margin: 12px 0;
    font-size: 8pt;
  }

  .legal-footer {
    margin-top: 16px;
    padding-top: 10px;
    border-top: 1px solid #dbe3ef;
    font-size: 6.5pt;
    color: #64748b;
    text-align: center;
  }

  .legal-footer--left {
    text-align: left;
  }

  .legal-footer__powered {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    margin-top: 8px;
  }

  .legal-footer__powered-text {
    font-size: 6.5pt;
    color: #64748b;
  }

  .sclera-brand-logo {
    display: block;
    width: auto;
    max-width: 60px;
    max-height: 28px;
    height: auto;
    object-fit: contain;
  }

  .invoice-meta {
    margin: 0 0 4px;
  }

  .invoice-meta .meta-line {
    margin: 3px 0;
    font-size: 8.5pt;
  }

  .invoice-table .pos {
    width: 48px;
  }

  .invoice-table th.num,
  .invoice-table td.num {
    width: 72px;
  }

  .invoice-totals {
    margin: 4px 0 8px;
    font-size: 8.5pt;
  }

  .invoice-totals__line {
    margin: 4px 0;
  }

  .invoice-totals__line--gross {
    margin-top: 8px;
    font-size: 9.5pt;
  }

  .service-description {
    margin: 4px 0 12px;
    font-size: 8.5pt;
    line-height: 1.45;
  }

  .payment-section {
    margin-top: 14px;
  }

  .compact .section {
    margin-bottom: 8px;
  }

  .compact .doc-title--center {
    margin-bottom: 10px;
  }

  /* Shared master design, calibrated against INV-004.pdf. */
  @page { size: A4; margin: 0; }

  .pdf-body { font-size: 9pt; line-height: 1.4; color: #111111; }
  .pdf-page {
    position: relative;
    width: 210mm;
    min-height: 296mm;
    max-width: none;
    margin: 0 auto;
    padding: 0 14mm 14mm;
  }

  .compact { position: relative; }
  .doc-header {
    height: 52mm;
    margin: 0 -14mm 0;
    padding: 13mm 56mm 10mm 14mm;
    background: #f3f4f6;
    align-items: center;
    overflow: hidden;
  }
  .doc-header--contract { gap: 16px; }
  .doc-header--contract .doc-header__left { flex-basis: 160px; }
  .doc-header__right { text-align: left; }
  .logo, .logo--compact { max-width: 210px; max-height: 84px; }
  .logo--large, .logo--contract { max-width: 230px; max-height: 94px; }
  .company-details { font-size: 7.5pt; color: #374151; }
  .company-name { font-size: 11pt; color: #111111; }
  .doc-meta-block { display: none; }
  .divider { display: none; }

  .doc-title, .doc-title--center {
    position: absolute;
    z-index: 2;
    top: 0;
    right: -14mm;
    display: flex;
    width: 42mm;
    height: 52mm;
    margin: 0;
    padding: 8mm 5mm;
    align-items: center;
    justify-content: center;
    background: #111111;
    color: #ffffff;
    font-size: 21pt;
    line-height: 1.08;
    text-align: center;
    letter-spacing: 0;
  }

  .compact > .section:first-of-type,
  .pdf-page > .section:first-of-type {
    width: 48%;
    margin: 11mm 0 12mm auto;
  }
  .section { margin-bottom: 9mm; }
  .section-title {
    margin: 0 0 7px;
    padding: 0;
    border: 0;
    font-size: 9pt;
    color: #111111;
  }
  .kv-grid { gap: 4px 14px; }
  .kv-item { font-size: 8.5pt; }
  .kv-label { min-width: 88px; color: #111111; }

  .data-table {
    margin: 8px 0 0;
    font-size: 8.5pt;
  }
  .data-table thead th {
    padding: 10px 12px;
    border: 0;
    background: #111111;
    color: #ffffff;
  }
  .data-table tbody td {
    padding: 12px;
    border-bottom: 1px solid #e5e7eb;
    background: #fbfbfc;
  }
  .data-table tbody tr:nth-child(even) td { background: #f3f4f6; }

  .totals-block { margin-top: 9mm; }
  .totals-panel {
    flex-basis: 44%;
    padding: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
  }
  .totals-row {
    margin: 0;
    padding: 8px 0;
    border-bottom: 1px solid #d1d5db;
    font-size: 9pt;
  }
  .totals-row--gross {
    margin: 0;
    padding-top: 10px;
    border: 0;
    font-size: 11pt;
  }

  .panel {
    padding: 10px 0;
    border: 0;
    border-top: 1px solid #e5e7eb;
    border-radius: 0;
    background: #ffffff;
  }
  .panel--highlight { background: #f9fafb; padding: 12px 14px; }
  .panel__title { font-size: 9pt; }
  .panel__row { font-size: 8.5pt; }
  .signature-box { border-color: #d1d5db; border-radius: 0; }
  .signature-line { border-color: #111111; }
  .legal-footer {
    margin-top: 12mm;
    padding-top: 6mm;
    border-color: #e5e7eb;
    color: #4b5563;
  }

  /* RE-50140 master template. Keep this final so it controls every document. */
  @page { size: A4; margin: 0; }
  .pdf-body { font-family: Arial, Helvetica, sans-serif; font-size: 9pt; color: #000; }
  .pdf-page {
    width: 210mm; min-height: 297mm; padding: 0 25mm 18mm;
    display: block; position: relative;
  }
  .compact { display: block; position: relative; }
  .inv { display: flex; flex-direction: column; min-height: 279mm; }

  .doc-header, .inv-header {
    order: 0; height: 72mm; margin: 0; padding: 7mm 0 0;
    display: flex; flex-direction: column; align-items: flex-end;
    justify-content: flex-start; background: #fff; overflow: visible;
  }
  .doc-header__left, .inv-header__brand { order: 0; max-width: 58mm; align-items: flex-end; }
  .doc-header__right { order: 1; width: 58mm; text-align: center; margin-top: 7mm; }
  .logo, .logo--compact, .logo--large, .logo--contract, .inv-logo {
    max-width: 52mm; max-height: 18mm; width: 52mm; height: 18mm; object-fit: contain;
  }
  .logo--placeholder, .inv-logo--placeholder { width: 52mm; height: 18mm; }
  .company-details { font-size: 6.5pt; line-height: 1.25; color: #000; }
  .company-name, .inv-company { font-size: 7pt; font-weight: 700; }
  .doc-meta-block { display: none; }
  .divider { display: none; }

  .doc-title, .doc-title--center, .inv-title {
    position: absolute; top: 30mm; left: 25mm; right: auto;
    display: block; width: auto; height: auto; min-width: 0;
    margin: 0; padding: 0; background: transparent; color: #000;
    font-size: 21pt; line-height: 1; font-weight: 800; text-align: left;
    text-transform: uppercase;
  }

  .inv-info, .compact > .section:first-of-type, .pdf-page > .section:first-of-type {
    order: 1; width: 100%; margin: 0 0 8mm; padding: 7mm 0 8mm;
    border-top: .35mm solid #8b8b8b; border-bottom: .35mm solid #8b8b8b;
  }
  .inv-info { display: block; }
  .inv-info__col { width: 100%; }
  .inv-info__col--right { margin-top: 3mm; }
  .inv-info__row, .kv-item { margin: 1px 0; font-size: 8pt; line-height: 1.25; }
  .inv-info__label, .kv-label { flex-basis: 34mm; min-width: 34mm; color: #000; font-weight: 700; }

  .section { margin-bottom: 7mm; }
  .section-title, .panel__title { border: 0; padding: 0; font-size: 10pt; font-weight: 700; }
  .compact > .section:nth-of-type(2), .pdf-page > .section:nth-of-type(2) {
    padding-bottom: 6mm; border-bottom: .35mm solid #8b8b8b;
  }

  .inv-table-wrap { order: 2; padding: 0; }
  .data-table, .inv-table { width: 100%; margin: 0; font-size: 10pt; border-collapse: collapse; }
  .data-table thead th, .inv-table thead th {
    padding: 5mm 2mm 4mm; background: #fff; color: #000;
    border: 0; font-size: 10pt; font-weight: 700;
  }
  .data-table tbody td, .inv-table tbody td {
    padding: 8mm 2mm 20mm; background: #fff !important; border: 0; vertical-align: top;
  }
  .data-table .pos, .inv-table .pos { width: 18mm; text-align: left; }
  .inv-item__sub { color: #000; font-size: 9pt; }
  .inv-table tbody tr.inv-table__spacer td { display: none; }

  .totals-block, .inv-summary {
    margin: 0; padding: 7mm 0; border-top: .35mm solid #8b8b8b;
    border-bottom: .35mm solid #8b8b8b;
  }
  .inv-summary { order: 4; }
  .inv-notes { order: 3; }
  .inv-signature { order: 5; }
  .inv-summary { display: flex; }
  .totals-panel, .inv-summary__right { flex: 0 0 45%; max-width: 45%; margin-left: auto; padding: 0; }
  .totals-row, .inv-total__row { padding: 2px 0; border: 0; font-size: 10pt; }
  .totals-row--gross, .inv-total__row--grand {
    margin-top: 6mm; padding: 6mm 0 0; border-top: .35mm solid #8b8b8b;
    font-size: 10pt; font-weight: 800;
  }

  .panel, .panel--highlight, .inv-notes {
    margin: 0 0 6mm; padding: 6mm 0; background: #fff; border: 0;
    border-bottom: .35mm solid #8b8b8b; border-radius: 0;
  }
  .signature-box { border: 0; border-bottom: .35mm solid #8b8b8b; }
  .signature-line { border-color: #8b8b8b; }

  .legal-footer, .inv-footer {
    margin-top: auto; padding: 6mm 0 0; border: 0;
    font-size: 6.5pt; color: #000;
  }
  .inv-footer { order: 10; }
  .inv-footer { display: flex; justify-content: space-between; align-items: flex-start; }
  .inv-footer__item { padding: 0; justify-content: flex-start; font-size: 6.5pt; color: #000; }
  .inv-footer__item:last-child { justify-content: flex-end; text-align: right; }
  .inv-footer__icon, .inv-footer__sep { display: none; }

  .reference-document { display:block; }
  .reference-meta { padding:7mm 0 8mm; border-top:.35mm solid #888; border-bottom:.35mm solid #888; }
  .reference-rows { display:grid; grid-template-columns:1fr; }
  .reference-row { display:grid; grid-template-columns:36mm 1fr; font-size:8pt; line-height:1.35; }
  .reference-service { padding:7mm 0 6mm; border-bottom:.35mm solid #888; }
  .reference-service h2,.reference-notes h2 { margin:0 0 5mm; font-size:10pt; }
  .reference-table { width:100%; border-collapse:collapse; font-size:10pt; }
  .reference-table th { padding:6mm 2mm 4mm; text-align:left; }
  .reference-table td { padding:8mm 2mm 20mm; vertical-align:top; }
  .reference-table .num { text-align:right; white-space:nowrap; }
  .reference-table td div { margin-top:2mm; font-size:9pt; }
  .reference-totals { padding:7mm 0; border-top:.35mm solid #888; border-bottom:.35mm solid #888; }
  .reference-totals>div:first-child { width:45%; margin-left:auto; }
  .reference-totals .reference-row { grid-template-columns:1fr auto; font-size:10pt; }
  .reference-grand { display:flex; justify-content:flex-end; gap:4mm; margin-top:6mm; padding-top:6mm; border-top:.35mm solid #888; font-size:10pt; }
  .reference-notes { padding:7mm 0; border-bottom:.35mm solid #888; min-height:25mm; }
  .reference-signatures { display:grid; grid-template-columns:1fr 1fr; gap:8mm; margin-top:8mm; }
  .reference-signatures>div { min-height:20mm; border-bottom:.35mm solid #888; display:flex; align-items:flex-end; font-size:7pt; }
  .reference-footer { position:absolute; left:25mm; right:25mm; bottom:18mm; display:flex; justify-content:space-between; font-size:6.5pt; line-height:1.35; }
  .reference-footer>div:last-child { text-align:right; }
  .reference-document .doc-header { height:62mm; }
  .reference-document .reference-meta { padding:5mm 0; }
  .reference-document .reference-service { padding:5mm 0 4mm; }
  .reference-document .reference-table th { padding:4mm 2mm 3mm; }
  .reference-document .reference-table td { padding:5mm 2mm 9mm; }
  .reference-document .reference-totals { padding:5mm 0; }
  .reference-document .reference-notes { padding:5mm 0; min-height:18mm; }
  .reference-document .reference-signatures { margin-top:5mm; }
  .reference-document .reference-signatures>div { min-height:14mm; }
  .reference-document .doc-header__left { transform:none; display:flex; width:58mm; align-items:center; justify-content:flex-end; gap:3mm; }
  .reference-document .doc-header__left::after { content:"SCLERA"; color:#aaa; font-size:17pt; font-weight:700; letter-spacing:.5pt; }
  .reference-document .doc-header__left .logo { width:14mm; height:14mm; max-width:14mm; max-height:14mm; }
  .reference-document .reference-totals>div:first-child { width:36%; }
  .reference-document .reference-notes { min-height:14mm; }
`;
