import { ArrowUpRight, CalendarDays, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PATHS } from '../../lib/routes';
import Modal from '../../ui/Modal';

const ActionChooserModal = ({ actionModal, onClose, onOpenBooking, hasActiveChatSession }) => (
  <Modal
    isOpen={Boolean(actionModal)}
    onClose={onClose}
    title={actionModal === 'book' ? 'Book a Session' : 'Message a Counselor'}
    description={actionModal === 'book'
      ? 'Choose how you would like to connect.'
      : hasActiveChatSession
        ? 'Your active chat session is ready.'
        : 'Messaging requires an accepted chat session.'}
  >
    {actionModal === 'book' ? (
      <div className="grid gap-3 sm:grid-cols-2">
        <button type="button" onClick={() => onOpenBooking('Face-To-Face')} className="group rounded-xl border border-line p-4 text-left hover:border-brand-400 hover:bg-brand-soft transition-colors">
          <CalendarDays size={20} className="text-brand-600" />
          <h3 className="mt-3 text-sm font-semibold text-ink">Face-to-face</h3>
          <p className="mt-1 text-xs leading-5 text-ink-muted">Choose an available counselor, date, and time.</p>
          <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-brand-700 dark:text-brand-300">View availability <ArrowUpRight size={13} /></span>
        </button>
        <button type="button" onClick={() => onOpenBooking('Chat')} className="group rounded-xl border border-line p-4 text-left hover:border-brand-400 hover:bg-brand-soft transition-colors">
          <MessageCircle size={20} className="text-brand-600" />
          <h3 className="mt-3 text-sm font-semibold text-ink">Chat session</h3>
          <p className="mt-1 text-xs leading-5 text-ink-muted">Request a private online conversation with a counselor.</p>
          <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-brand-700 dark:text-brand-300">Request session <ArrowUpRight size={13} /></span>
        </button>
      </div>
    ) : hasActiveChatSession ? (
      <div>
        <div className="rounded-xl border border-brand-200 bg-brand-soft p-4">
          <p className="text-sm font-medium text-ink">Active chat session found</p>
          <p className="mt-1 text-xs leading-5 text-ink-muted">Continue your private conversation with your counselor.</p>
        </div>
        <div className="mt-4 flex justify-end">
          <Link to={PATHS.MESSAGES} onClick={onClose} className="inline-flex min-h-10 items-center justify-center rounded-lg bg-brand-600 px-4 text-xs font-semibold text-brand-fg hover:bg-brand-700">Open messages</Link>
        </div>
      </div>
    ) : (
      <div>
        <div className="rounded-xl border border-line bg-canvas p-4">
          <p className="text-sm font-medium text-ink">No active chat session</p>
          <p className="mt-1 text-xs leading-5 text-ink-muted">Request a chat session and wait for a counselor to accept it before messaging.</p>
        </div>
        <div className="mt-4 flex justify-end">
          <button type="button" onClick={() => onOpenBooking('Chat')} className="inline-flex min-h-10 items-center justify-center rounded-lg bg-brand-600 px-4 text-xs font-semibold text-brand-fg hover:bg-brand-700">Request chat session</button>
        </div>
      </div>
    )}
  </Modal>
);

export default ActionChooserModal;
