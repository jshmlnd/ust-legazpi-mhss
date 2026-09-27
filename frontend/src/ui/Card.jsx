/**
 * Card — surface panel with optional header (title + description + actions)
 * and footer. The single container for grouped content on every page.
 */
const Card = ({ title, description, actions, footer, children, className = '', bodyClassName = '' }) => (
  <section className={`bg-surface border border-line rounded-xl shadow-e1 ${className}`}>
    {(title || actions) && (
      <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-line">
        <div className="min-w-0">
          {title && <h2 className="text-sm font-semibold text-ink">{title}</h2>}
          {description && <p className="mt-0.5 text-xs text-ink-muted">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    )}
    <div className={`px-5 py-4 ${bodyClassName}`}>{children}</div>
    {footer && <div className="px-5 py-3 border-t border-line">{footer}</div>}
  </section>
);

export default Card;
