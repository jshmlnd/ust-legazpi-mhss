import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Accordion — progressive disclosure for secondary/rare content.
 * Items: [{ id, title, description?, content }]. Single-open per group.
 */
const Accordion = ({ items, defaultOpenId = null, className = '' }) => {
  const [openId, setOpenId] = useState(defaultOpenId);

  return (
    <div className={`divide-y divide-line rounded-xl border border-line bg-surface shadow-e1 ${className}`}>
      {items.map((item) => {
        const isOpen = openId === item.id;
        return (
          <div key={item.id}>
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : item.id)}
              aria-expanded={isOpen}
              aria-controls={`acc-${item.id}`}
              className="w-full flex items-center justify-between gap-4 px-5 py-3.5 text-left
                hover:bg-canvas transition-colors duration-150 rounded-xl focus-visible:rounded-lg"
            >
              <span className="min-w-0">
                <span className="block text-sm font-medium text-ink">{item.title}</span>
                {item.description && (
                  <span className="block text-xs text-ink-muted mt-0.5">{item.description}</span>
                )}
              </span>
              <ChevronDown
                size={16}
                className={`shrink-0 text-ink-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
            </button>
            {isOpen && (
              <div id={`acc-${item.id}`} className="px-5 pb-4 pt-1 text-sm text-ink-soft">
                {item.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Accordion;
