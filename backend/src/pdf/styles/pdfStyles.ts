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
`;
