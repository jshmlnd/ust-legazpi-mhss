import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { NAV_ITEMS, PATHS } from '../lib/routes';

const useRBAC = (authUser) => {
  const role = authUser?.userType?.toLowerCase() ?? null;

  const visibleLinks = useMemo(
    () =>
      NAV_ITEMS
        .filter((item) => item.allowedRoles.includes(role))
        .map((item) => ({
          ...item,
          resolvedPath: item.buildPath && authUser?._id
            ? item.buildPath(authUser._id)
            : item.path,
        })),
    [role, authUser],
  );

  const homeTarget = role === 'counselor' ? PATHS.DASHBOARD : PATHS.HOME;
  const isAuthenticated = !!authUser;

  return { role, visibleLinks, homeTarget, isAuthenticated };
};

const useMobileMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return { isOpen, toggle: () => setIsOpen((prev) => !prev) };
};

const useActiveState = (pathname, resolvedPath) =>
  useMemo(() => pathname === resolvedPath, [pathname, resolvedPath]);

const NavLink = ({ link, isMobile }) => {
  const { pathname } = useLocation();
  const isActive = useActiveState(pathname, link.resolvedPath);

  const base = 'font-medium uppercase transition-all duration-300';
  const mobile = 'text-lg tracking-[0.2em]';
  const desktop = 'relative text-xs tracking-[0.15em] group';

  return (
    <Link
      key={link.label}
      to={link.resolvedPath}
      className={`${base} ${isMobile ? mobile : desktop} ${isActive ? 'text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
    >
      {link.label}
      {!isMobile && (
        <span
          className={`absolute -bottom-1 left-0 h-px bg-gray-900 transition-all duration-300 ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}`}
        />
      )}
    </Link>
  );
};

const MobileNavLink = ({ link, index, isOpen }) => {
  const { pathname } = useLocation();
  const isActive = useActiveState(pathname, link.resolvedPath);

  return (
    <Link
      key={link.label}
      to={link.resolvedPath}
      className={`text-lg tracking-[0.2em] font-medium uppercase transition-all duration-500 ${isActive ? 'text-gray-900' : 'text-gray-500 hover:text-gray-900'} ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
      style={{ transitionDelay: isOpen ? `${index * 120}ms` : '0ms' }}
    >
      {link.label}
    </Link>
  );
};

const BrandLink = ({ homeTarget }) => (
  <Link to={homeTarget} className="flex items-center gap-3">
    <img
      src="https://i.ibb.co/9mn4fzQJ/new-ust-logo.png"
      alt="UST-Legazpi Logo"
      className="size-12"
    />
    <span className="text-sm tracking-[0.2em] font-medium text-gray-900 uppercase select-none">
      UST-Legazpi
    </span>
  </Link>
);

const AuthButton = ({ isAuthenticated, onLogout }) => {
  if (isAuthenticated) {
    return (
      <button
        onClick={onLogout}
        className="hidden md:inline-flex items-center px-5 py-[7px] text-xs tracking-[0.1em] font-medium uppercase rounded-full border border-gray-900 text-gray-900 bg-transparent hover:bg-gray-900 hover:text-white transition-all duration-300"
      >
        Logout
      </button>
    );
  }

  return (
    <Link
      to="/login"
      className="hidden md:inline-flex items-center px-5 py-[7px] text-xs tracking-[0.1em] font-medium uppercase rounded-full border border-gray-900 text-gray-900 bg-transparent hover:bg-gray-900 hover:text-white transition-all duration-300"
    >
      Sign In
    </Link>
  );
};

const HamburgerButton = ({ isOpen, onClick }) => (
  <button
    onClick={onClick}
    className="md:hidden relative size-8 flex items-center justify-center text-gray-900"
    aria-label={isOpen ? 'Close menu' : 'Open menu'}
  >
    <div className="flex flex-col items-center justify-center gap-[5px]">
      <span
        className={`block h-[1.5px] w-5 bg-gray-900 rounded-full transition-all duration-300 ${isOpen ? 'rotate-45 translate-y-[6.5px]' : ''}`}
      />
      <span
        className={`block h-[1.5px] w-5 bg-gray-900 rounded-full transition-all duration-300 ${isOpen ? '-rotate-45 -translate-y-[6.5px]' : ''}`}
      />
    </div>
  </button>
);

const MobileOverlay = ({ visibleLinks, isAuthenticated, onLogout, isOpen }) => (
  <div
    className={`fixed inset-0 z-40 bg-white flex flex-col items-center justify-center transition-all duration-500 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
  >
    <nav className="flex flex-col items-center gap-10">
      {visibleLinks.map((link, index) => (
        <MobileNavLink key={link.label} link={link} index={index} isOpen={isOpen} />
      ))}

      {isAuthenticated ? (
        <button
          onClick={onLogout}
          className={`mt-2 px-8 py-3 text-sm tracking-[0.1em] font-medium uppercase rounded-full border border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white transition-all duration-500 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
          style={{ transitionDelay: isOpen ? `${visibleLinks.length * 120}ms` : '0ms' }}
        >
          Logout
        </button>
      ) : (
        <Link
          to="/login"
          className={`mt-2 px-8 py-3 text-sm tracking-[0.1em] font-medium uppercase rounded-full border border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white transition-all duration-500 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
          style={{ transitionDelay: isOpen ? `${visibleLinks.length * 120}ms` : '0ms' }}
        >
          Sign In
        </Link>
      )}
    </nav>
  </div>
);

const Navbar = () => {
  const { authUser, logout } = useAuthStore();
  const { visibleLinks, homeTarget, isAuthenticated } = useRBAC(authUser);
  const { isOpen, toggle } = useMobileMenu();
  const navigate = useNavigate();

  const handleLogout = useCallback(async () => {
    await logout();
    navigate('/login');
  }, [logout, navigate]);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-[68px] bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-10 h-full flex items-center justify-between">
          <BrandLink homeTarget={homeTarget} />

          <nav className="hidden md:flex items-center gap-10">
            {visibleLinks.map((link) => (
              <NavLink key={link.label} link={link} isMobile={false} />
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <AuthButton isAuthenticated={isAuthenticated} onLogout={handleLogout} />
            <HamburgerButton isOpen={isOpen} onClick={toggle} />
          </div>
        </div>
      </header>

      <MobileOverlay
        visibleLinks={visibleLinks}
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
        isOpen={isOpen}
      />

      <div className="h-[68px]" />
    </>
  );
};

export default Navbar;
