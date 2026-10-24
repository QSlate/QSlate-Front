'use client';

import {
  ChevronsLeft,
  ChevronsRight,
  Code2,
  History,
  LayoutGrid,
  Moon,
  Settings2,
  Store,
  Sun,
} from 'lucide-react';
import Link from 'next/link';

import { useUserStore } from '@/entities/user/model';
import { useHydratedStore } from '@/shared/lib/store';

const navigation = [
  { title: 'Mini IDE & Builder', icon: Code2 },
  { title: 'Widget Marketplace', icon: Store },
  { title: 'Backtest Runs', icon: History },
  { title: 'Settings', icon: Settings2 },
];

export function LabSidebar() {
  const collapsed = useHydratedStore(
    useUserStore,
    (state) => state.sidebarCollapsed,
    false
  );
  const theme = useHydratedStore(useUserStore, (state) => state.theme, 'dark');
  const session = useHydratedStore(
    useUserStore,
    (state) => state.session,
    null
  );
  const toggleTheme = useUserStore((state) => state.toggleTheme);
  const toggleSidebar = useUserStore((state) => state.toggleSidebar);
  const name =
    typeof session?.name === 'string' ? session.name : 'Enzo Gallini';
  const role =
    typeof session?.role === 'string' ? session.role : 'Quant Researcher';
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((word) => word[0])
    .join('');

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
          className="lab-nav-item is-active"
          aria-current="page"
          title="Lab Workspace"
        >
          <LayoutGrid size={14} />
          <span className="sidebar-label">Lab Workspace</span>
        </Link>
        {navigation.map(({ title, icon: Icon }) => (
          <button
            key={title}
            type="button"
            className="lab-nav-item"
            disabled
            title={`${title} — coming soon`}
            aria-label={`${title} — coming soon`}
          >
            <Icon size={14} />
            <span className="sidebar-label">{title}</span>
          </button>
        ))}
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
            <span className="lab-positive">demo</span>
          </div>
          {!session ? (
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
