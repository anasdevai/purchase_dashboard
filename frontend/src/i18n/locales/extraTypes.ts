/** Extended UI namespaces (customers, inventory, admin, calendar, email). */



export type CustomersTranslations = {

  title: string

  description: string

  searchPlaceholder: string

  createBtn: string

  mergeBtn: string

  exportBtn: string

  pdfExportBtn: string

  tableId: string

  tableName: string

  tableCompany: string

  tableContact: string

  tableDate: string

  tableActions: string

  noCustomers: string

  editTooltip: string

  deleteTooltip: string

  viewTooltip: string

  deleteConfirmTitle: string

  deleteConfirmMessage: string

  deleting: string

  deletedToast: string

  exportCsvSuccess: string

  exportCsvFailed: string

  exportPdfSuccess: string

  exportPdfFailed: string

  page: string

  of: string

}



export type CustomerFormTranslations = {

  titleCreate: string

  titleEdit: string

  salutation: string

  salutationPlaceholder: string

  mr: string

  ms: string

  diverse: string

  firstName: string

  lastName: string

  company: string

  vatId: string

  street: string

  zipCode: string

  city: string

  phone: string

  email: string

  dateOfBirth: string

  newsletter: string

  notes: string

  cancel: string

  save: string

  saving: string

  loading: string

  errEmail: string

  errRequired: string

}



export type CustomerMergeTranslations = {

  title: string

  description: string

  searchPrimaryLabel: string

  searchDuplicateLabel: string

  searchPlaceholder: string

  searchBtn: string

  selectBtn: string

  selectedLabel: string

  warningTitle: string

  warningDesc: string

  merge: string

  merging: string

  cancel: string

  noResults: string

  errSameCustomer: string

  errSelection: string

  success: string

}



export type CustomerDetailTranslations = {

  backToList: string

  loading: string

  editBtn: string

  deleteBtn: string

  customerNumber: string

  salutation: string

  dob: string

  address: string

  phone: string

  email: string

  company: string

  vatId: string

  newsletter: string

  newsletterSubbed: string

  newsletterOptOut: string

  dateAdded: string

  tabTimeline: string

  tabDevices: string

  tabNotes: string

  notesTitle: string

  notesPlaceholder: string

  notesSaveBtn: string

  notesSavedSuccess: string

  notesSaveFailed: string

  noTimeline: string

  noDevices: string

  typeContract: string

  typeRepairOrder: string

  typeQuotation: string

  typeInvoice: string

  status: string

  amount: string

  viewBtn: string

  deleteConfirmTitle: string

  deleteConfirmMessage: string

  deletedSuccess: string

  profileOverview: string

  device: string

  type: string

  source: string

  date: string

  saving: string

}



export type EmailLogsTranslations = {

  title: string

  description: string

  tableTo: string

  tableSubject: string

  tableDate: string

  tableStatus: string

  tableActions: string

  statusSent: string

  statusFailed: string

  noLogs: string

  inspectTitle: string

  inspectSubject: string

  inspectTo: string

  inspectDate: string

  inspectBody: string

  errorDetails: string

  page: string

  of: string

}



export type CalendarTranslations = {

  pageTitle: string

  pageDescription: string

  newAppointment: string

  today: string

  day: string

  week: string

  month: string

  list: string

  searchPlaceholder: string

  allStatuses: string

  statusBooked: string

  statusConfirmed: string

  statusArrived: string

  statusCancelled: string

  statusVoided: string

  allSources: string

  sourceManual: string

  sourceOrder: string

  sourceWebsite: string

  exportCsv: string

  exportIcal: string

  minutesShort: string

  edit: string

  delete: string

  disconnectGoogleTooltip: string

  googleConnectedLabel: string

  connectGoogleLabel: string

  googleConnectFailed: string

  disconnectTitle: string

  disconnectMessage: string

  disconnect: string

  disconnected: string

  disconnectFailed: string

  connectedSuccess: string

  rescheduled: string

  rescheduleFailed: string

  exported: string

  exportFailed: string

  deleteTitle: string

  deleteMessage: string

  deleted: string

  deleteFailed: string

  time: string

  scheduleSlot: string

  daySummary: string

  noAppointmentsDay: string

  noAppointments: string

  title: string

  customer: string

  startTime: string

  endTime: string

  duration: string

  source: string

  actions: string

}



export type AppointmentFormTranslations = {

  titleEdit: string

  titleCreate: string

  loadFailed: string

  reminderSent: string

  reminderFailed: string

  endTimeAfterStart: string

  saveFailed: string

  titleLabel: string

  searchCustomer: string

  customerSearchPlaceholder: string

  linkRepairOrder: string

  orderSearchPlaceholder: string

  deviceBrand: string

  deviceModel: string

  imeiSerial: string

  startTime: string

  endTime: string

  status: string

  source: string

  internalNotes: string

  sendReminder: string

  cancel: string

  save: string

  saving: string

}



export type InventoryCommonTranslations = {

  delete: string

  cancel: string

  save: string

  days: string

  items: string

  actions: string

  loadFailed: string

  status: string

  active: string

  inactive: string

  email: string

  website: string

  edit: string

  updatedSuccess: string

  createdSuccess: string

  deletedSuccess: string

  deleteFailed: string

  saveError: string

  requiredCompanyEmail: string

}



export type InventoryLayoutTranslations = {

  title: string

  subtitle: string

  spareParts: string

  suppliers: string

  orders: string

  receipts: string

  adjustments: string

}



export type InventorySuppliersTranslations = {

  deleteTitle: string

  deleteMessage: string

  deleteMessageNamed: string

  searchPlaceholder: string

  addSupplier: string

  emptyTitle: string

  emptyHint: string

  colCompany: string

  colPhone: string

  colDelivery: string

  modalEdit: string

  modalAdd: string

  companyName: string

  contactPerson: string

  phone: string

  email: string

  website: string

  deliveryTime: string

  paymentTerms: string

  activeCheckbox: string

  saved: string

  saveFailed: string

  updatedSuccess: string

  createdSuccess: string

  deletedSuccess: string

  deleteFailed: string

}



export type InventorySparePartsTranslations = {

  deleteTitle: string

  deleteMessage: string

  deleteMessageNamed: string

  statTotal: string

  statValue: string

  statLowStock: string

  searchPlaceholder: string

  allCategories: string

  lowStockOnly: string

  addPart: string

  emptyTitle: string

  emptyHint: string

  colCompatibility: string

  colStock: string

  colPrices: string

  colLocation: string

  netPurchase: string

  grossSale: string

  adjustStock: string

  modalEdit: string

  modalAdd: string

  itemNumber: string

  partName: string

  category: string

  compatibleModels: string

  initialStock: string

  minimumStock: string

  defaultSupplier: string

  purchasePrice: string

  salePrice: string

  storageLocation: string

  active: string

  activeCheckbox: string

  adjustTitle: string

  adjustHint: string

  adjustReason: string

  bookAdjustment: string

  saved: string

  saveFailed: string

  updatedSuccess: string

  createdSuccess: string

  deletedSuccess: string

  deleteFailed: string

}



export type InventoryOrdersTranslations = {

  cancelTitle: string

  cancelMessage: string

  cancelMessageNamed: string

  cancelConfirm: string

  cancelKeep: string

  searchPlaceholder: string

  allStatuses: string

  placeOrder: string

  emptyTitle: string

  emptyHint: string

  colOrderNumber: string

  colSupplier: string

  colOrderDate: string

  colExpected: string

  colStatus: string

  colTotal: string

  modalTitle: string

  selectSupplier: string

  expectedDate: string

  orderItems: string

  saved: string

  saveFailed: string

  cancelledSuccess: string

  cancelFailed: string

  viewDetails: string

  cancelOrder: string

  statusOrdered: string

  statusShipped: string

  statusPartiallyDelivered: string

  statusDelivered: string

  statusCancelled: string

  selectSupplierRequired: string

  itemsRequired: string

  duplicateParts: string

}



export type InventoryGoodsReceiptTranslations = {

  confirmTitle: string

  confirmMessage: string

  confirmBook: string

  bookDelivery: string

  receiptsLog: string

  recordTitle: string

  selectOrder: string

  notes: string

  bookReceipt: string

  saved: string

  saveFailed: string

  colReceiptNumber: string

  colOrder: string

  colDate: string

  colItems: string

  emptyLog: string

  receivedQty: string

  orderedQty: string

}



export type InventoryStockAdjustmentsTranslations = {

  searchPlaceholder: string

  emptyTitle: string

  emptyHint: string

  colDate: string

  colPart: string

  colQuantity: string

  colReason: string

  deletedSku: string

  deletedPart: string

}



export type InventoryTranslations = {

  layout: InventoryLayoutTranslations

  common: InventoryCommonTranslations

  suppliers: InventorySuppliersTranslations

  spareParts: InventorySparePartsTranslations

  orders: InventoryOrdersTranslations

  goodsReceipt: InventoryGoodsReceiptTranslations

  stockAdjustments: InventoryStockAdjustmentsTranslations

}



export type AdminTranslations = {

  panelTitle: string

  panelSubtitle: string

  navigation: string

  dashboard: string

  manageUsers: string

  addUser: string

  backToApp: string

  logout: string

  backToUsers: string

  backToUserProfile: string

  manageUsersTitle: string

  manageUsersSubtitle: string

  searchUsersPlaceholder: string

  addNewUser: string

  loadingUsers: string

  loadUsersFailed: string

  tryAgain: string

  noUsersFound: string

  searchUsers: string

  role: string

  status: string

  allRoles: string

  roleAdmin: string

  roleStaff: string

  allStatuses: string

  activeOnly: string

  inactiveOnly: string

  search: string

  reset: string

  userDetails: string

  contracts: string

  invoices: string

  repairs: string

  joinedDate: string

  active: string

  inactive: string

  paginationPage: string

  paginationOf: string

  paginationTotal: string

  dashboardTitle: string

  dashboardSubtitle: string

  loadingDashboard: string

  loadDashboardFailed: string

  totalUsers: string

  totalContracts: string

  totalInvoices: string

  repairOrders: string

  totalRevenue: string

  todayRevenue: string

  totalPurchases: string

  todayPurchases: string

  revenueSubtitle: string

  revenueTodaySubtitle: string

  contractsSubtitle: string

  contractsTodaySubtitle: string

  usersBreakdown: string

  contractsBreakdown: string

  invoicesBreakdown: string

  repairOrdersBreakdown: string

  recentUsers: string

  viewAll: string

  user: string

  joined: string

  statAdmins: string

  statStaff: string

  statCompleted: string

  statDraft: string

  statCancelled: string

  statToday: string

  statPaid: string

  statOpen: string

  statReceived: string

  statInProgress: string

  statReady: string

  usersActiveInactive: string

  contractsTodayDrafts: string

  invoicesTodayOpen: string

  repairsTodayInProgress: string

  userNotFound: string

  userUpdated: string

  userUpdateFailed: string

  userDeleteFailed: string

  editAccount: string

  cancelEditing: string

  displayName: string

  emailAddress: string

  changePassword: string

  passwordPlaceholder: string

  accountStatus: string

  accountRole: string

  roleStaffLabel: string

  roleAdminLabel: string

  savingChanges: string

  saveUserSettings: string

  deleteUserTitle: string

  deleteUserMessage: string

  deleteUserConfirm: string

  contractsCard: string

  contractsCardSubtitle: string

  invoicesCard: string

  invoicesCardSubtitle: string

  repairOrdersCard: string

  repairOrdersCardSubtitle: string

  userContractsTitle: string

  userContractsSubtitle: string

  userInvoicesTitle: string

  userInvoicesSubtitle: string

  userRepairOrdersTitle: string

  userRepairOrdersSubtitle: string

  loadDataFailed: string

  noPhone: string

  noEmail: string

  viewDetails: string

  downloadPdf: string

  newUserTitle: string

  newUserSubtitle: string

  createUser: string

  creatingUser: string

  userCreated: string

  createUserFailed: string

  fullName: string

  password: string

  passwordRequired: string

}



export type ExtraTranslations = {

  customers: CustomersTranslations

  customerForm: CustomerFormTranslations

  customerMerge: CustomerMergeTranslations

  customerDetail: CustomerDetailTranslations

  emailLogs: EmailLogsTranslations

  calendar: CalendarTranslations

  appointmentForm: AppointmentFormTranslations

  inventory: InventoryTranslations

  admin: AdminTranslations

}


