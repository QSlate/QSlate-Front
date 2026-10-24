'use client';

import {
  ChevronsLeft,
  ChevronsRight,
  Code2,
  History,
  LayoutGrid,
  LogOut,
  Moon,
  Settings2,
  Store,
  Sun,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { useAuthStore, useUserStore } from '@/entities/user/model';
import { apiClient } from '@/shared/api';
import { useHydratedStore } from '@/shared/lib/store';

const navigation = [
  { title: 'Mini IDE & Builder', icon: Code2, href: '/lab/ide' },
  { title: 'Widget Marketplace', icon: Store, href: '/lab/marketplace' },
  { title: 'Backtest Runs', icon: History, href: '/lab/runs' },
  { title: 'Settings', icon: Settings2, href: '/lab/settings' },
];

export function LabSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const collapsed = useHydratedStore(
    useUserStore,
    (state) => state.sidebarCollapsed,
    false
  );
  const theme = useHydratedStore(useUserStore, (state) => state.theme, 'dark');
  const authUser = useHydratedStore(useAuthStore, (state) => state.user, null);
  const session = useHydratedStore(
    useUserStore,
    (state) => state.session,
    null
  );
  const toggleTheme = useUserStore((state) => state.toggleTheme);
  const toggleSidebar = useUserStore((state) => state.toggleSidebar);

  const name =
    authUser?.display_name ||
    authUser?.username ||
    (typeof session?.name === 'string' ? session.name : 'Quant Researcher');

  const role =
    authUser?.email ||
    (typeof session?.role === 'string' ? session.role : 'Quantitative Analyst');

  const initials = (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word[0])
      .join('') || 'QS'
  ).toUpperCase();

  const handleLogout = async () => {
    try {
      await apiClient.logout();
    } catch {
      // Ignore network errors on logout
    } finally {
      useAuthStore.getState().clearAuth();
      router.push('/login');
    }
  };

  return (
    <aside
      className={`lab-sidebar ${collapsed ? 'is-collapsed' : ''}`}
      aria-label="Workspace navigation"
    >
      <Link href="/" className="lab-brand" aria-label="QSlate home">
        <span className="lab-logo">QS</span>
        <span className="sidebar-label">QSlate</span>
        <span className="lab-kernel sidebar-label">PRO KERNEL</span>
      </Link>
      <nav>
        <Link
          href="/lab"
          className={`lab-nav-item ${pathname === '/lab' ? 'is-active' : ''}`}
          aria-current={pathname === '/lab' ? 'page' : undefined}
          title="Lab Workspace"
        >
          <LayoutGrid size={14} />
          <span className="sidebar-label">Lab Workspace</span>
        </Link>
        {navigation.map(({ title, icon: Icon, href }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={title}
              href={href}
              className={`lab-nav-item ${isActive ? 'is-active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
              title={title}
            >
              <Icon size={14} />
              <span className="sidebar-label">{title}</span>
            </Link>
          );
        })}
      </nav>
      <div className="lab-sidebar-bottom">
        <div className="lab-user-card">
          <div className="lab-user">
            <span className="lab-avatar">{initials}</span>
            <div className="sidebar-label">
              <strong>{name}</strong>
              <span>{role}</span>
            </div>
            <i className="lab-status-dot sidebar-label" />
          </div>
          <div className="lab-cluster sidebar-label">
            <i className="lab-status-dot" />
            <span>gVisor Cluster:</span>
            <span className="lab-positive">99.98% green</span>
          </div>
          {!authUser && !session ? (
            <span className="lab-demo-user sidebar-label">
              Demo workspace · local data
            </span>
          ) : null}
        </div>
        <div className="lab-sidebar-controls">
          <button
            type="button"
            className="lab-button lab-theme-button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            <span className="sidebar-label">
              {theme === 'dark' ? 'Light' : 'Dark'}
            </span>
          </button>
          <button
            type="button"
            className="lab-button lab-logout-button"
            onClick={handleLogout}
            aria-label="Log out of session"
            title="Log out of session"
          >
            <LogOut size={14} />
          </button>
          <button
            type="button"
            className="lab-button lab-collapse-button"
            onClick={toggleSidebar}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
          >
            {collapsed ? (
              <ChevronsRight size={14} />
            ) : (
              <ChevronsLeft size={14} />
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
