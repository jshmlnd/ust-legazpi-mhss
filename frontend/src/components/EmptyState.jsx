const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
    {Icon && <Icon size={32} className="text-neutral-300 mb-4" />}
    <h3 className="text-sm font-medium text-neutral-500 mb-1">{title}</h3>
    {description && <p className="text-xs text-neutral-400 max-w-xs">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export default EmptyState;
