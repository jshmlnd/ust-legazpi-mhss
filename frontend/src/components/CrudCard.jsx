import RoleGate from './RoleGate';
import { Pencil, Trash2 } from 'lucide-react';

const CrudCard = ({ children, onEdit, onDelete, allowedRoles = ['counselor'] }) => (
  <div className="relative group">
    <RoleGate roles={allowedRoles}>
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {onEdit && (
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="size-7 flex items-center justify-center rounded-sm bg-white border border-neutral-200 text-neutral-500 hover:text-neutral-900 hover:border-neutral-400 transition-colors"
            title="Edit"
          >
            <Pencil size={12} />
          </button>
        )}
        {onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="size-7 flex items-center justify-center rounded-sm bg-white border border-neutral-200 text-neutral-500 hover:text-red-600 hover:border-red-300 transition-colors"
            title="Delete"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>
    </RoleGate>
    {children}
  </div>
);

export default CrudCard;
