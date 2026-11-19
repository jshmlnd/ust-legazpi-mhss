import Modal from '../../ui/Modal';
import Button from '../../ui/Button';
import { Radio, Select } from '../../ui/Input';

const LEVEL_OPTIONS = [
  { value: 'gca', label: 'Level 1 - GCA (Admitted)' },
  { value: 'referred', label: 'Level 2 - Referred' },
  { value: 'adjunct', label: 'Level 3 - Adjunct' },
];

const ActionLevelModal = ({
  isOpen,
  onClose,
  levelSession,
  levelChoice,
  setLevelChoice,
  referredId,
  setReferredId,
  counselors,
  savingLevel,
  saveLevel,
}) => (
  <Modal
    isOpen={isOpen}
    onClose={() => !savingLevel && onClose()}
    title="Action taken"
    description={levelSession ? `${levelSession.studentName || levelSession.id} · ${levelSession.type}` : undefined}
    footer={
      <>
        <Button variant="secondary" onClick={onClose} disabled={savingLevel}>Cancel</Button>
        <Button onClick={saveLevel} loading={savingLevel}>Save</Button>
      </>
    }
  >
    <div className="space-y-3">
      {LEVEL_OPTIONS.map((opt) => (
        <Radio
          key={opt.value}
          name="action-taken-level"
          value={opt.value}
          checked={levelChoice === opt.value}
          onChange={() => setLevelChoice(opt.value)}
          label={opt.label}
        />
      ))}
      {levelChoice === 'referred' && (
        <Select
          label="Refer to"
          required
          value={referredId}
          onChange={(e) => setReferredId(e.target.value)}
          placeholder={counselors.length === 0 ? 'No other counselors available' : 'Select a counselor'}
          options={counselors.map((c) => ({ value: String(c._id), label: c.fullName }))}
          disabled={counselors.length === 0}
          className="pt-1"
        />
      )}
    </div>
  </Modal>
);

export default ActionLevelModal;
