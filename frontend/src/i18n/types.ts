export type Language = 'de' | 'en'

export type TranslationSchema = {
  app: {
    nameLine1: string
    nameLine2: string
    footer: string
  }
  nav: {
    dashboard: string
    newContract: string
    contracts: string
    searchContracts: string
    settings: string
    logout: string
  }
  topbar: {
    notifications: string
    roleAdmin: string
  }
  pages: {
    dashboard: string
    newContract: string
    contracts: string
    searchContracts: string
    contractDetail: string
    settings: string
  }
  dashboard: {
    contractsToday: string
    contractsTodayDelta: string
    totalPurchaseToday: string
    totalPurchaseTodayDelta: string
    currentContracts: string
    viewCurrentContracts: string
    draftContracts: string
    continueEditing: string
    recentContracts: string
    viewAll: string
    quickActions: string
    newContractBtn: string
    searchContractsBtn: string
    allContractsBtn: string
  }
  table: {
    serialNo: string
    contractNumber: string
    customerName: string
    device: string
    imeiSerial: string
    price: string
    date: string
    status: string
    action: string
    delete: string
    continue: string
    customer: string
    open: string
    view: string
    download: string
    allContracts: string
    noResults: string
    resultCount: string
  }
  status: {
    completed: string
    draft: string
    cancelled: string
  }
  contractWizard: {
    titleCompact: string
    titleFull: string
    steps: {
      customerInfo: string
      deviceInfo: string
      confirmations: string
      photos: string
      signature: string
      reviewSave: string
    }
    customerInformation: string
    fullName: string
    fullNamePlaceholder: string
    fullNameRequired: string
    emailOptional: string
    emailPlaceholder: string
    phone: string
    phonePlaceholder: string
    phoneRequired: string
    dobOptional: string
    address: string
    addressPlaceholder: string
    addressRequired: string
    idOptional: string
    idPlaceholder: string
    idPhoto: string
    uploadHint: string
    uploadFormats: string
    idPhotoInvalidType: string
    idPhotoTooLarge: string
    removeFile: string
    replaceFile: string
    customerSignature: string
    clear: string
    saveSignature: string
    nextDeviceInfo: string
    back: string
    next: string
    stepPlaceholder: string
  }
  contractsPage: {
    title: string
    newContract: string
  }
  contractDetail: {
    contract: string
    print: string
    downloadPdf: string
    details: string
    pdfPreview: string
    documentTitle: string
    customer: string
    device: string
    imeiLabel: string
    purchasePrice: string
    terms: string
    term1: string
    term2: string
    term3: string
    customerSignature: string
    shopRepresentative: string
    backToContracts: string
  }
  login: {
    subtitle: string
    email: string
    password: string
    showPassword: string
    hidePassword: string
    login: string
    mvpNote: string
    continue: string
  }
  settings: {
    description: string
    shopDetails: string
    shopName: string
    shopAddress: string
    shopPhone: string
    shopEmail: string
    shopEmailPlaceholder: string
    ownerName: string
    ownerNamePlaceholder: string
    shopLogo: string
    shopLogoHint: string
    noLogo: string
    uploadLogo: string
    removeLogo: string
    save: string
    savedSuccess: string
    errors: {
      required: string
      invalidEmail: string
      logoType: string
      logoSize: string
      logoRead: string
      missingForPdf: string
    }
  }
  confirmDelete: {
    title: string
    message: string
    cancel: string
    confirm: string
    deleting: string
    success: string
  }
  search: {
    placeholder: string
  }
  language: {
    label: string
    de: string
    en: string
  }
}
