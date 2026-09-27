import { useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { LogOut, PanelLeftClose, Menu } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { NAV_SECTIONS, ACCOUNT_ITEM } from '../../lib/routes';
import { confirmAction } from '../../lib/confirm';

const Logo = () => (
  <img src="https://ik.imagekit.io/zjkm666/new-ust-logo.png" alt="UST-Legazpi logo" className="size-9 shrink-0" />
);

/* Home route per role — students get the marketing/home page, everyone else
   their dashboard (same mapping as RoleRoute). */
const ROLE_HOME = { student: '/', counselor: '/dashboard', administrator: '/admin' };

const NavItem = ({ item, collapsed, onNavigate }) => {
  const Icon = item.icon;
  return (
    <li>
      <NavLink
        to={item.path}
        end={item.path === '/'}
        onClick={onNavigate}
        className={({ isActive }) =>
          `group relative flex items-center gap-3 rounded-lg px-3 py-2 my-1 min-h-[44px] text-sm font-medium
           transition-colors duration-150 outline-none
           ${collapsed ? 'justify-center px-0' : ''}
           ${isActive
             ? 'bg-side-active text-side-ink'
             : 'text-side-ink-soft hover:bg-side-hover hover:text-side-ink'}`
        }
      >
        {({ isActive }) => (
          <>
            {isActive && (
              <span
                className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-brand-400"
                aria-hidden="true"
              />
            )}
            <Icon size={18} className="shrink-0" aria-hidden="true" />
            <span className={`truncate ${collapsed ? 'hidden' : ''}`}>{item.label}</span>
            {collapsed && (
              <span
                role="tooltip"
                className="pointer-events-none absolute left-full ml-3 z-50 whitespace-nowrap rounded-md bg-raised
                  border border-line px-2.5 py-1.5 text-xs font-medium text-ink shadow-e2
                  opacity-0 translate-x-[-4px] group-hover:opacity-100 group-hover:translate-x-0
                  group-focus-within:opacity-100 transition-all duration-150"
              >
                {item.label}
              </span>
            )}
            {isActive && <span className="sr-only">(current page)</span>}
          </>
        )}
      </NavLink>
    </li>
  );
};

const GroupDivider = ({ label, collapsed }) => (
  <li className="pt-3 first:pt-0">
    {collapsed ? (
      <div className="mx-2 border-t border-side-line" aria-hidden="true" />
    ) : (
      <p className="px-3 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-side-ink-muted">{label}</p>
    )}
  </li>
);

const SidebarContent = ({ collapsed, onNavigate }) => {
  const { authUser, logout } = useAuthStore();
  const navigate = useNavigate();
  const role = authUser?.userType?.toLowerCase();
  const homePath = ROLE_HOME[role] || '/';

  const handleLogout = async () => {
    const confirmed = await confirmAction({
      title: 'Are you sure you want to log out?',
      confirmLabel: 'Log out',
    });
    if (!confirmed) return;
    await logout();
    navigate('/login');
  };

  const sections = NAV_SECTIONS.map((s) => ({
    ...s,
    items: s.items.filter((i) => i.roles?.includes(role)),
  })).filter((s) => s.items.length > 0);

  return (
    <div className="flex h-full flex-col bg-side">
      {/* brand */}
      <div className={`flex items-center gap-3 h-16 shrink-0 ${collapsed ? 'justify-center px-0' : 'px-4'}`}>
        <Link
          to={homePath}
          onClick={onNavigate}
          className="flex items-center gap-3 min-w-0"
          aria-label={role === 'student' ? 'UST-Legazpi Mental Health Support — Home' : 'UST-Legazpi Mental Health Support — Dashboard'}
        >
          <Logo />
          {!collapsed && (
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-side-ink truncate">UST-Legazpi</span>
              <span className="block text-[10px] text-side-ink-muted truncate">Mental Health Support</span>
            </span>
          )}
        </Link>
      </div>

      {/* nav sections */}
      <nav aria-label="Primary" className="flex-1 overflow-y-auto overflow-x-hidden px-3 pb-4">
        <ul className="space-y-0.5">
          {sections.map((section) => (
            <div key={section.id} className="contents">
              <GroupDivider label={section.label} collapsed={collapsed} />
              {section.items.map((item) => (
                <NavItem key={item.path} item={item} collapsed={collapsed} onNavigate={onNavigate} />
              ))}
            </div>
          ))}
        </ul>
      </nav>

      {/* user footer: secondary actions — account + logout */}
      <div className="shrink-0 border-t border-side-line p-3 space-y-0.5">
        <Link
          to={ACCOUNT_ITEM.path}
          onClick={onNavigate}
          className={`flex items-center gap-3 rounded-lg p-2 min-h-[44px] transition-colors hover:bg-side-hover
            ${collapsed ? 'justify-center' : ''}`}
        >
          <span className="size-9 shrink-0 rounded-full bg-brand-600 text-brand-fg flex items-center justify-center text-sm font-semibold">
            {authUser?.fullName?.[0]?.toUpperCase() || 'U'}
          </span>
          {!collapsed && (
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-side-ink truncate">{authUser?.fullName}</span>
              <span className="block text-[11px] text-side-ink-muted truncate capitalize">{role}</span>
            </span>
          )}
        </Link>
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 rounded-lg p-2 min-h-[44px] text-sm font-medium text-side-ink-soft
            hover:bg-side-hover hover:text-side-ink transition-colors ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut size={18} aria-hidden="true" />
          {!collapsed && 'Log out'}
        </button>
      </div>
    </div>
  );
};

/* ── Desktop rail ── */
export const DesktopSidebar = ({ collapsed }) => (
  <aside
    className={`hidden md:flex fixed left-0 top-0 bottom-0 z-40 flex-col transition-[width] duration-200 ease-out
      border-r border-side-line ${collapsed ? 'w-[76px]' : 'w-[260px]'}`}
  >
    <SidebarContent collapsed={collapsed} />
  </aside>
);

/* ── Mobile drawer ── */
export const MobileSidebar = ({ open, onClose }) => {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <div className={`md:hidden fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`}>
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-ink/50 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0'}`}
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        aria-hidden={!open}
        className={`absolute left-0 top-0 bottom-0 w-[280px] max-w-[85vw] flex flex-col shadow-e3 border-r border-side-line
          transition-transform duration-200 ease-out ${open ? 'translate-x-0 visible' : '-translate-x-full invisible'}`}
      >
        <SidebarContent collapsed={false} onNavigate={onClose} />
      </aside>
    </div>
  );
};

/* Collapse toggle button — placed in the Topbar */
export const CollapseToggle = ({ collapsed, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
    aria-expanded={!collapsed}
    title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
    className="hidden md:flex items-center justify-center size-9 shrink-0 rounded-md
      text-ink-muted hover:text-ink hover:bg-line transition-colors"
  >
    {collapsed ? <PanelLeftClose size={18} /> : <Menu size={18} />}
  </button>
);
