import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Phone, MapPin } from 'lucide-react';
import Modal from '../../ui/Modal';
import { axiosInstance } from '../../lib/axios';
import { PATHS } from '../../lib/routes';

// shortcut: hardcoded national numbers, re-check by phone before each release.
// Verified by test call on 2026-11-20: 1553 and Hopeline 0917-558-4673 answer.
// NCMH mobile 0917-899-8727 could not be reached (2026-11-19, 2026-11-20) and stays removed.
const NATIONAL_LINES = [
  { name: 'Hopeline PH', display: '0917-558-4673', tel: '+639175584673' },
  { name: 'Emergency (police / ambulance)', display: '911', tel: '911' },
];

const telHref = (contact) => `tel:${contact.replace(/[^\d+]/g, '')}`;

const CrisisSupportModal = ({ isOpen, onClose }) => {
  const [local, setLocal] = useState([]);

  useEffect(() => {
    if (!isOpen) return;
    axiosInstance.get('/resources')
      .then(({ data }) => setLocal(data.filter((r) => r.type === 'hotline' || r.type === 'location').slice(0, 5)))
      .catch(() => { /* national numbers above still show */ });
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="You're not alone"
      description="It sounds like things are really hard right now. Please reach out to someone who can help."
    >
      <a
        href="tel:1553"
        className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-semibold text-brand-fg bg-brand-600 rounded-lg hover:bg-brand-700"
      >
        <Phone size={16} /> Call the National Suicide Prevention Hotline · 1553
      </a>
      <p className="mt-1.5 text-xs text-ink-muted text-center">NCMH Crisis Hotline, free and open 24/7 (Luzon landlines).</p>

      <h3 className="mt-5 mb-2 text-xs font-semibold text-ink">Other numbers you can call or text</h3>
      <ul className="divide-y divide-line border border-line rounded-lg">
        {NATIONAL_LINES.map((l) => (
          <li key={l.tel} className="flex items-center justify-between gap-3 px-3 py-2">
            <span className="text-sm text-ink">{l.name}</span>
            <a href={`tel:${l.tel}`} className="text-sm font-semibold text-brand-soft-ink hover:underline">{l.display}</a>
          </li>
        ))}
      </ul>

      {local.length > 0 && (
        <>
          <h3 className="mt-5 mb-2 text-xs font-semibold text-ink">Help near Legazpi</h3>
          <ul className="space-y-2">
            {local.map((r) => (
              <li key={r._id} className="px-3 py-2 border border-line rounded-lg">
                <p className="text-sm font-medium text-ink">{r.title}</p>
                {r.address && (
                  <p className="flex items-center gap-1 text-xs text-ink-muted"><MapPin size={12} /> {r.address}</p>
                )}
                {r.hours && <p className="text-xs text-ink-muted">{r.hours}</p>}
                {r.contact && (
                  <a
                    href={r.contact.includes('@') ? `mailto:${r.contact}` : telHref(r.contact)}
                    className="text-xs font-semibold text-brand-soft-ink hover:underline"
                  >
                    {r.contact}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <Link to={PATHS.RESOURCES} onClick={onClose} className="text-xs font-semibold text-brand-soft-ink hover:underline">
          See all mental health resources
        </Link>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-xs font-semibold text-ink border border-line rounded-lg hover:border-line-strong"
        >
          I'm okay for now
        </button>
      </div>
    </Modal>
  );
};

export default CrisisSupportModal;
