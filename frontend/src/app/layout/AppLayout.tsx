import { Outlet } from 'react-router-dom'
import { ConfirmDialogProvider } from '../../components/common/ConfirmDialogProvider'
import { LayoutProvider } from './LayoutContext'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function AppLayout() {
  return (
    <ConfirmDialogProvider>
    <LayoutProvider>
      <div className="app-viewport h-screen overflow-hidden bg-app-bg">
        <Sidebar />
        <div className="app-viewport flex h-screen min-w-0 flex-col lg:pl-sidebar">
          <Topbar />
          <main className="app-scroll-content min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-4 pt-4 sm:px-6 sm:pt-6">
            <div className="mx-auto w-full min-w-0 max-w-screen-2xl">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </LayoutProvider>
    </ConfirmDialogProvider>
  )
}
