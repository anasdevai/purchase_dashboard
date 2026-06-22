import { Outlet } from 'react-router-dom'
import { LayoutProvider } from '../../app/layout/LayoutContext'
import { AdminSidebar } from './AdminSidebar'
import { AdminTopbar } from './AdminTopbar'

export function AdminLayout() {
  return (
    <LayoutProvider>
      <div className="app-viewport h-screen overflow-hidden bg-slate-50 text-slate-700">
        <AdminSidebar />
        <div className="app-viewport flex h-screen min-w-0 flex-col lg:pl-sidebar">
          <AdminTopbar />
          <main className="app-scroll-content min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-4 pt-4 sm:px-6 sm:pt-6">
            <div className="mx-auto w-full min-w-0 max-w-screen-2xl">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </LayoutProvider>
  )
}
