import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

/**
 * PageShell — the standard page container inside AppLayout.
 * Header: optional breadcrumb trail, h1 title, description, and primary actions.
 * `narrow` constrains focused single-column pages.
 */
const PageShell = ({ title, description, breadcrumb, actions, narrow = false, children }) => (
  <div className={`mx-auto w-full px-4 sm:px-6 lg:px-10 py-7 sm:py-10 pb-16 ${narrow ? 'max-w-3xl' : 'max-w-7xl'}`}>
    {(breadcrumb || title || actions) && (
      <header className="relative mb-7 sm:mb-10 pl-4 sm:pl-5 before:absolute before:left-0 before:top-1 before:h-10 before:w-1 before:rounded-full before:bg-gradient-to-b before:from-brand-400 before:to-brand-700">
        {breadcrumb?.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-2">
            <ol className="flex items-center gap-1 text-xs text-ink-muted">
              {breadcrumb.map((crumb, i) => {
                const last = i === breadcrumb.length - 1;
                return (
                  <li key={crumb.label} className="flex items-center gap-1">
                    {i > 0 && <ChevronRight size={12} className="text-ink-muted/60" aria-hidden="true" />}
                    {last || !crumb.to ? (
                      <span className={last ? 'text-ink-soft font-medium' : ''}>{crumb.label}</span>
                    ) : (
                      <Link to={crumb.to} className="hover:text-ink transition-colors">{crumb.label}</Link>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        )}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div className="min-w-0">
            {title && <h1 className="text-2xl sm:text-3xl font-semibold tracking-[-0.025em] text-ink">{title}</h1>}
            {description && <p className="mt-1.5 text-sm leading-relaxed text-ink-muted max-w-2xl">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2.5 shrink-0">{actions}</div>}
        </div>
      </header>
    )}
    {children}
  </div>
);

export default PageShell;
