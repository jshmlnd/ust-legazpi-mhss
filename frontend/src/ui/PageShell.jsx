import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

/**
 * PageShell — the standard page container inside AppLayout.
 * Header: optional breadcrumb trail, h1 title, description, and primary actions.
 * `narrow` constrains focused single-column pages.
 */
const PageShell = ({ title, description, breadcrumb, actions, narrow = false, children }) => (
  <div className={`mx-auto w-full px-4 sm:px-6 lg:px-10 py-6 sm:py-8 pb-16 ${narrow ? 'max-w-3xl' : 'max-w-7xl'}`}>
    {(breadcrumb || title || actions) && (
      <header className="mb-6 sm:mb-8">
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
            {title && <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>}
            {description && <p className="mt-1 text-sm text-ink-muted max-w-2xl">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2.5 shrink-0">{actions}</div>}
        </div>
      </header>
    )}
    {children}
  </div>
);

export default PageShell;
