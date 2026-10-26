import { Link, useLocation } from 'react-router-dom';
import { Menu as MenuIcon } from 'lucide-react';
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

const Topbar = ({ authUser, onOpenSidebar, collapsed, onToggleCollapse }) => {
  const title = usePageTitle();

  return (
    <header className="sticky top-0 z-30 flex h-[4.5rem] items-center gap-2 border-b border-line bg-surface/95 shadow-e1 px-3 sm:px-6">
      {/* mobile: open drawer */}
      <button
        type="button"
        onClick={onOpenSidebar}
        aria-label="Open navigation menu"
        className="md:hidden flex items-center justify-center size-10 rounded-xl text-ink-soft hover:bg-line transition-colors"
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
        className="hidden md:flex items-center justify-center size-9 rounded-xl
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
        <Link
          to="/account"
          className="flex items-center gap-2 rounded-xl py-1.5 pl-1 pr-2 min-h-[40px] hover:bg-line transition-colors"
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
