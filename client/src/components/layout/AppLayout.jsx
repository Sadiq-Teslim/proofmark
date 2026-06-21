import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { BadgeCheck, GalleryVerticalEnd, LayoutDashboard, Menu, Plus } from 'lucide-react';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';
import { titleForPath } from './navItems.js';

const mobileTabs = [
  { to: '/app', label: 'Home', icon: LayoutDashboard, end: true },
  { to: '/app/properties', label: 'Properties', icon: GalleryVerticalEnd },
  { to: '/app/verify', label: 'Verify', icon: BadgeCheck },
];

export default function AppLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { pathname } = useLocation();
  const title = titleForPath(pathname);

  // Close the drawer + scroll content to top on route change.
  useEffect(() => {
    setDrawerOpen(false);
    document.querySelector('.app-content')?.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className={`app-shell ${sidebarCollapsed ? 'is-sidebar-collapsed' : ''}`}>
      <Sidebar
        open={drawerOpen}
        collapsed={sidebarCollapsed}
        onClose={() => setDrawerOpen(false)}
        onToggleCollapse={() => setSidebarCollapsed((value) => !value)}
      />
      <div
        className={`app-scrim ${drawerOpen ? 'is-on' : ''}`}
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />

      <div className="app-main">
        <Topbar title={title} onMenu={() => setDrawerOpen(true)} />
        <main className="app-content">
          <div className="app-content-inner" key={pathname}>
            <Outlet />
          </div>
        </main>
      </div>

      <nav className="app-tabbar">
        {mobileTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) => `app-tab ${isActive ? 'active' : ''}`}
            >
              <Icon size={20} />
              <span>{tab.label}</span>
            </NavLink>
          );
        })}
        <NavLink to="/app/protect" className="app-tab app-tab-cta" aria-label="Protect image">
          <Plus size={22} />
          <span>Protect</span>
        </NavLink>
        <button className="app-tab" onClick={() => setDrawerOpen(true)}>
          <Menu size={20} />
          <span>More</span>
        </button>
      </nav>
    </div>
  );
}
