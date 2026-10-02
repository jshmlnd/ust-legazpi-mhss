import { Link, useLocation } from 'react-router-dom';
import { Moon, Sun, Menu as MenuIcon } from 'lucide-react';
import { usePrefs } from '../../lib/prefs';
import { NAV_SECTIONS, ACCOUNT_ITEM } from '../../lib/routes';

const usePageTitle = () => {
  const { pathname } = useLocation();
  for (const section of NAV_SECTIONS) {
    for (const item of section.items) {
      if (pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path))) {
        return item.label;
      }
    }
  }
  if (pathname === ACCOUNT_ITEM.path || pathname.startsWith(`${ACCOUNT_ITEM.path}/`)) {
    return ACCOUNT_ITEM.label;
  }
  return '';
};

const ThemeToggle = ({ authUserId }) => {
  const { prefs, togglePref } = usePrefs(authUserId);
  const dark = !!(prefs.calmMode || prefs.switchmode);
  return (
    <button
      type="button"
      onClick={() => togglePref('switchmode')}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="flex items-center justify-center size-10 shrink-0 rounded-md text-ink-muted
        hover:text-ink hover:bg-line transition-colors"
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
};

const Topbar = ({ authUser, onOpenSidebar, collapsed, onToggleCollapse }) => {
  const title = usePageTitle();
  const userId = authUser?._id;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-line bg-surface/80 shadow-e1 backdrop-blur-xl px-3 sm:px-5">
      {/* mobile: open drawer */}
      <button
        type="button"
        onClick={onOpenSidebar}
        aria-label="Open navigation menu"
        className="md:hidden flex items-center justify-center size-10 rounded-md text-ink-soft hover:bg-line transition-colors"
      >
        <MenuIcon size={20} />
      </button>

      {/* desktop: collapse rail */}
      <button
        type="button"
        onClick={onToggleCollapse}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-expanded={!collapsed}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="hidden md:flex items-center justify-center size-9 rounded-md
          text-ink-muted hover:text-ink hover:bg-line transition-colors"
      >
        <MenuIcon size={18} />
      </button>

      {/* current section label */}
      <span className="hidden sm:flex items-center gap-2 truncate text-sm font-semibold text-ink">
        <span className="h-4 w-1 rounded-full bg-brand-500" aria-hidden="true" />
        {title}
      </span>

      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle authUserId={userId} />
        <Link
          to="/account"
          className="flex items-center gap-2 rounded-md py-1.5 pl-1 pr-2 min-h-[40px] hover:bg-line transition-colors"
          aria-label="My Account"
        >
          <span className="size-8 rounded-full bg-brand-600 text-brand-fg flex items-center justify-center text-xs font-semibold">
            {authUser?.fullName?.[0]?.toUpperCase() || 'U'}
          </span>
          <span className="hidden lg:block text-xs font-medium text-ink max-w-[140px] truncate">
            {authUser?.fullName}
          </span>
        </Link>
      </div>
    </header>
  );
};

export default Topbar;
