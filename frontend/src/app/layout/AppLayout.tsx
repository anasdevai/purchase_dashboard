import { Outlet } from 'react-router-dom'
import clsx from 'clsx'
import { ConfirmDialogProvider } from '../../components/common/ConfirmDialogProvider'
import { LayoutProvider, useLayout } from './LayoutContext'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

function AppLayoutInner() {
  const { sidebarExpanded } = useLayout()

  return (
    <div className="app-viewport h-screen overflow-hidden bg-app-bg">
      <Sidebar />
      <div
        className={clsx(
          'app-viewport flex h-screen min-w-0 flex-col pl-0 transition-[padding] duration-300 ease-in-out',
          sidebarExpanded ? 'lg:pl-[264px]' : 'lg:pl-[103px]',
        )}
      >
        <Topbar />
        <main className="app-scroll-content min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-4 pt-4 sm:px-6 sm:pt-6">
          <div className="mx-auto w-full min-w-0 max-w-screen-2xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export function AppLayout() {
  return (
    <ConfirmDialogProvider>
      <LayoutProvider>
        <AppLayoutInner />
      </LayoutProvider>
    </ConfirmDialogProvider>
  )
}
