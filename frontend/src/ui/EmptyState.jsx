/**
 * EmptyState — icon + title + description + optional action.
 * Used whenever a list/collection has nothing to show.
 */
const EmptyState = ({ icon: Icon, title, description, action, compact = false }) => (
  <div className={`flex flex-col items-center justify-center text-center ${compact ? 'py-8 px-6' : 'py-16 px-6'}`}>
    {Icon && (
      <div className="size-12 rounded-full bg-line flex items-center justify-center mb-3">
        <Icon size={22} className="text-ink-muted" aria-hidden="true" />
      </div>
    )}
    <h3 className="text-sm font-semibold text-ink">{title}</h3>
    {description && <p className="mt-1 text-xs text-ink-muted max-w-xs leading-relaxed">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export default EmptyState;
