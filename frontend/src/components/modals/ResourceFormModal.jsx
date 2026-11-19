import { useState } from 'react';
import { Button, Input, Textarea, Select } from '../../ui';
import Modal from '../../ui/Modal';

export const RESOURCE_TYPES = [
  { value: 'hotline', label: 'Emergency Hotline' },
  { value: 'psychiatrist', label: 'Psychiatrist' },
  { value: 'psychologist', label: 'Psychologist' },
  { value: 'location', label: 'Physical Center' },
];

const FORM_EMPTY = { title: '', type: 'hotline', description: '', url: '', address: '', hours: '', contact: '', mapUrl: '' };

/* Keyed by the parent on `editing` so add vs. edit sessions remount with
   fresh form state — no setState-in-effect reset needed. */
const ResourceFormModal = ({ isOpen, onClose, onSubmit, initial }) => {
  const [form, setForm] = useState(initial ? { ...FORM_EMPTY, ...initial } : FORM_EMPTY);
  const isEdit = !!initial;

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
    setForm(FORM_EMPTY);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Resource' : 'Add Resource'} wide>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Title" name="title" value={form.title} onChange={handleChange} placeholder="e.g., Bicol Region Mental Health Hotline" required />
          <Select
            label="Type"
            name="type"
            value={form.type}
            onChange={handleChange}
            options={RESOURCE_TYPES.map((t) => ({ value: t.value, label: t.label }))}
          />
        </div>
        <Textarea label="Description" name="description" value={form.description} onChange={handleChange} placeholder="Brief summary of the resource..." rows={3} resize="y" required />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <Input label="Address" name="address" value={form.address} onChange={handleChange} placeholder="Full address" />
          <Input label="Hours" name="hours" value={form.hours} onChange={handleChange} placeholder="e.g., Mon–Fri 8AM–5PM" />
          <Input label="Contact" name="contact" value={form.contact} onChange={handleChange} placeholder="Phone number" />
        </div>
        {form.type !== 'hotline' && (
          <Input
            label="Google Maps Link"
            name="mapUrl"
            value={form.mapUrl ?? ''}
            onChange={handleChange}
            placeholder="https://www.google.com/maps/..."
            helper="Paste a Google Maps link to drop the pin automatically, or leave it blank to locate the address."
          />
        )}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button type="submit" size="sm">{isEdit ? 'Save Changes' : 'Add Resource'}</Button>
        </div>
      </form>
    </Modal>
  );
};

export default ResourceFormModal;
