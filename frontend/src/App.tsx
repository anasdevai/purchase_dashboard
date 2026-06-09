import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { ProtectedRoute } from './auth/ProtectedRoute'
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
import { SearchContractsPage } from './pages/SearchContractsPage'
import { SettingsPage } from './pages/SettingsPage'

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

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
                <Route path="/invoices/new" element={<NewInvoicePage />} />
                <Route path="/invoices" element={<InvoicesPage />} />
                <Route path="/invoices/:invoiceId" element={<InvoiceDetailPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  )
}
