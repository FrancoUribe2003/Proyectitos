import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { SearchProvider } from '../lib/SearchProvider';
import { GuestImportProvider } from './GuestImport';
import { MobileSidebar } from './MobileSidebar';
import { SidebarContent } from './Sidebar';
import { Topbar } from './Topbar';

const COLLAPSE_KEY = 'sidebar_collapsed';

function readCollapsed(): boolean {
  try {
    return window.localStorage.getItem(COLLAPSE_KEY) === '1';
  } catch {
    return false;
  }
}

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      window.localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0');
    } catch {
      // Storage can be unavailable in private browsing; the layout still works.
    }
  }, [collapsed]);

  return (
    <SearchProvider>
      <GuestImportProvider>
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink focus:shadow-float"
        >
          Saltar al contenido
        </a>

        <aside
          className={`fixed inset-y-0 left-0 z-40 hidden border-r border-line bg-canvas transition-[width] duration-200 lg:flex lg:flex-col ${
            collapsed ? 'w-[76px]' : 'w-[17.5rem]'
          }`}
        >
          <SidebarContent
            collapsed={collapsed}
            onToggleCollapsed={() => setCollapsed((value) => !value)}
          />
        </aside>

        <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />

        <div
          className={`min-h-svh transition-[padding] duration-200 ${
            collapsed ? 'lg:pl-[76px]' : 'lg:pl-[17.5rem]'
          }`}
        >
          <Topbar
            onOpenSidebar={() => setMobileOpen(true)}
            sidebarOpen={mobileOpen}
            sidebarCollapsed={collapsed}
          />
          <main
            id="contenido"
            tabIndex={-1}
            className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8 outline-none sm:px-6 lg:px-10 lg:pb-20 lg:pt-10"
          >
            <Outlet />
          </main>
        </div>
      </GuestImportProvider>
    </SearchProvider>
  );
}
