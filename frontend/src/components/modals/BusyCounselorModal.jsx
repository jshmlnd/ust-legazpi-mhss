import Modal from '../../ui/Modal';

const BusyCounselorModal = ({
  isOpen,
  onClose,
  chatSubmitting,
  onBookAnotherCounselor,
  onWaitForCounselor,
}) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title="Counselor is Busy"
    description="This counselor is currently in a face-to-face session."
  >
    <p className="text-sm text-ink mb-5">Wait for counselor or book another counselor?</p>
    <div className="flex flex-wrap justify-end gap-3">
      <button
        type="button"
        onClick={onBookAnotherCounselor}
        disabled={chatSubmitting}
        className="px-4 py-2 text-xs font-semibold text-ink border border-line rounded-lg hover:border-line-strong disabled:opacity-50"
      >
        Book Another Counselor
      </button>
      <button
        type="button"
        onClick={onWaitForCounselor}
        disabled={chatSubmitting}
        className="px-4 py-2 text-xs font-semibold text-brand-fg bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-50"
      >
        {chatSubmitting ? 'Requesting...' : 'Wait for Counselor'}
      </button>
    </div>
  </Modal>
);

export default BusyCounselorModal;
