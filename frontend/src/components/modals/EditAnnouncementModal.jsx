import { useState, useRef } from 'react';
import { Image, X } from 'lucide-react';
import Modal from '../../ui/Modal';

const MAX_IMAGES = 4;

const EditAnnouncementModal = ({ isOpen, onClose, announcement, onSave }) => {
  const [title, setTitle] = useState(announcement?.title || '');
  const [body, setBody] = useState(announcement?.body || '');
  const [images, setImages] = useState(announcement?.images || []);
  const fileInputRef = useRef(null);

  const handleImageSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    const remaining = MAX_IMAGES - images.length;
    const toAdd = files
      .filter((file) => file.type.startsWith('image/') && file.size <= 10 * 1024 * 1024)
      .slice(0, remaining)
      .map((file) => ({ file, preview: URL.createObjectURL(file) }));
    setImages((prev) => [...prev, ...toAdd]);
    e.target.value = '';
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    await onSave({
      title: title.trim(),
      body: body.trim(),
      existingImages: images.filter((image) => typeof image === 'string'),
      files: images.filter((image) => typeof image !== 'string').map((image) => image.file),
    });
  };

  const isCreate = !announcement;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isCreate ? 'Create Announcement' : 'Edit Announcement'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-ink-muted">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Announcement title..."
            className="w-full bg-transparent border border-line text-sm rounded-lg px-3 py-2.5 text-ink placeholder:text-ink-muted focus:border-brand-600 outline-none transition-colors"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-ink-muted">Body</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your announcement..."
            rows={5}
            className="w-full bg-transparent border border-line text-sm rounded-lg px-3 py-2.5 text-ink placeholder:text-ink-muted focus:border-brand-600 outline-none transition-colors resize-y min-h-[100px]"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-ink-muted">
            Images ({images.length}/{MAX_IMAGES})
          </label>
          {images.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mb-2">
              {images.map((image, i) => (
                <div key={i} className="relative group rounded-lg overflow-hidden border border-line">
                  <img src={typeof image === 'string' ? image : image.preview} alt="" className="w-full h-28 object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1.5 right-1.5 size-5 flex items-center justify-center rounded-full bg-side/60 text-brand-fg opacity-0 group-hover:opacity-100 max-md:opacity-100 transition-opacity"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
          {images.length < MAX_IMAGES && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-dashed border-line-strong rounded-lg text-xs text-ink-muted hover:border-line-strong hover:text-ink-soft transition-colors"
            >
              <Image size={14} /> Add image or GIF
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            multiple
            onChange={handleImageSelect}
            className="hidden"
          />
        </div>
        <div className="flex items-center justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-ink-muted hover:text-ink transition-colors">Cancel</button>
          <button type="submit" className="px-5 py-2 text-xs font-semibold text-brand-fg bg-brand-600 hover:bg-brand-700 transition-colors rounded-lg">{isCreate ? 'Create' : 'Save Changes'}</button>
        </div>
      </form>
    </Modal>
  );
};

export default EditAnnouncementModal;
