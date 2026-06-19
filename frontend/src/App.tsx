import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { AdminProtectedRoute } from './auth/AdminProtectedRoute'
import { LanguageProvider } from './i18n/LanguageProvider'
import { AppLayout } from './app/layout/AppLayout'
import { ContractDetailPage } from './pages/ContractDetailPage'
import { ContractsPage } from './pages/ContractsPage'
import { DashboardPage } from './pages/DashboardPage'
import { InvoiceDetailPage, NewInvoicePage } from './pages/InvoiceDetailPage'
import { InvoicesPage } from './pages/InvoicesPage'
import { LoginPage } from './pages/LoginPage'
import { NewContractPage } from './pages/NewContractPage'
import { NewRepairOrderPage, RepairOrderDetailPage } from './pages/RepairOrderDetailPage'
import { RepairOrdersPage } from './pages/RepairOrdersPage'
import { NewQuotationPage, QuotationDetailPage } from './pages/QuotationDetailPage'
import { QuotationsPage } from './pages/QuotationsPage'
import { SearchContractsPage } from './pages/SearchContractsPage'
import { SettingsPage } from './pages/SettingsPage'
import { EmailLogsPage } from './pages/EmailLogsPage'
import { CustomersPage } from './pages/CustomersPage'
import { CustomerDetailPage } from './pages/CustomerDetailPage'
import { MobileSignaturePage } from './pages/MobileSignaturePage'
import { CalendarPage } from './pages/CalendarPage'

// Admin imports
import { AdminLayout } from './pages/admin/AdminLayout'
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage'
import { AdminUsersPage } from './pages/admin/AdminUsersPage'
import { AdminNewUserPage } from './pages/admin/AdminNewUserPage'
import { AdminUserDetailPage } from './pages/admin/AdminUserDetailPage'
import { AdminUserContractsPage } from './pages/admin/AdminUserContractsPage'
import { AdminUserInvoicesPage } from './pages/admin/AdminUserInvoicesPage'
import { AdminUserRepairOrdersPage } from './pages/admin/AdminUserRepairOrdersPage'

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signature/:token" element={<MobileSignaturePage />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/contracts/new" element={<NewContractPage />} />
                <Route path="/contracts" element={<ContractsPage />} />
                <Route path="/contracts/search" element={<SearchContractsPage />} />
                <Route path="/contracts/:contractId" element={<ContractDetailPage />} />
                <Route path="/repair-orders/new" element={<NewRepairOrderPage />} />
                <Route path="/repair-orders" element={<RepairOrdersPage />} />
                <Route path="/repair-orders/:repairOrderId" element={<RepairOrderDetailPage />} />
                <Route path="/quotations/new" element={<NewQuotationPage />} />
                <Route path="/quotations" element={<QuotationsPage />} />
                <Route path="/quotations/:quotationId" element={<QuotationDetailPage />} />
                <Route path="/invoices/new" element={<NewInvoicePage />} />
                <Route path="/invoices" element={<InvoicesPage />} />
                <Route path="/invoices/:invoiceId" element={<InvoiceDetailPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/email-logs" element={<EmailLogsPage />} />
                <Route path="/customers" element={<CustomersPage />} />
                <Route path="/customers/:customerId" element={<CustomerDetailPage />} />
                <Route path="/calendar" element={<CalendarPage />} />
              </Route>
            </Route>

            <Route element={<AdminProtectedRoute />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboardPage />} />
                <Route path="users" element={<AdminUsersPage />} />
                <Route path="users/new" element={<AdminNewUserPage />} />
                <Route path="users/:userId" element={<AdminUserDetailPage />} />
                <Route path="users/:userId/contracts" element={<AdminUserContractsPage />} />
                <Route path="users/:userId/invoices" element={<AdminUserInvoicesPage />} />
                <Route path="users/:userId/repair-orders" element={<AdminUserRepairOrdersPage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  )
}
