import { useEffect, useRef, useState } from 'react';
import { Loader, ZoomIn, ZoomOut } from 'lucide-react';
import Modal from '../../ui/Modal';
import Button from '../../ui/Button';

const VIEW = 256; // on-screen crop circle, px
const OUT = 512; // saved image, px
const MAX_ZOOM = 3;

// Keep the image covering the whole circle.
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const fit = (pos, size) => ({
  x: clamp(pos.x, VIEW - size.w, 0),
  y: clamp(pos.y, VIEW - size.h, 0),
});

/**
 * Drag to reposition and zoom a photo inside a circle, then hand back a
 * square JPEG File of exactly what the circle shows.
 */
const AvatarCropModal = ({ src, onCancel, onSave }) => {
  const [img, setImg] = useState(null);
  const [error, setError] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);
  const drag = useRef(null);

  useEffect(() => {
    if (!src) return;
    const image = new Image();
    image.crossOrigin = 'anonymous'; // existing photos come from Cloudinary; needed to export the canvas
    image.onload = () => {
      const base = VIEW / Math.min(image.naturalWidth, image.naturalHeight);
      const w = image.naturalWidth * base;
      const h = image.naturalHeight * base;
      setImg(image);
      setZoom(1);
      setPos({ x: (VIEW - w) / 2, y: (VIEW - h) / 2 });
    };
    image.onerror = () => setError('Could not load this photo.');
    image.src = src;
  }, [src]);

  const base = img ? VIEW / Math.min(img.naturalWidth, img.naturalHeight) : 1;
  const size = img ? { w: img.naturalWidth * base * zoom, h: img.naturalHeight * base * zoom } : { w: VIEW, h: VIEW };

  const changeZoom = (next) => {
    const z = clamp(next, 1, MAX_ZOOM);
    // Zoom around the circle's centre so the framed face stays put.
    const ratio = z / zoom;
    const c = VIEW / 2;
    const nextSize = { w: (size.w / zoom) * z, h: (size.h / zoom) * z };
    setPos(fit({ x: c - (c - pos.x) * ratio, y: c - (c - pos.y) * ratio }, nextSize));
    setZoom(z);
  };

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
  };
  const onPointerMove = (e) => {
    if (!drag.current) return;
    setPos(fit({ x: e.clientX - drag.current.x, y: e.clientY - drag.current.y }, size));
  };
  const onPointerUp = () => { drag.current = null; };

  const onKeyDown = (e) => {
    const step = e.shiftKey ? 20 : 5;
    const moves = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
    if (moves[e.key]) {
      e.preventDefault();
      setPos(fit({ x: pos.x + moves[e.key][0], y: pos.y + moves[e.key][1] }, size));
    } else if (e.key === '+' || e.key === '=') changeZoom(zoom + 0.1);
    else if (e.key === '-') changeZoom(zoom - 0.1);
  };

  const handleSave = async () => {
    const canvas = document.createElement('canvas');
    canvas.width = OUT;
    canvas.height = OUT;
    const k = OUT / VIEW;
    canvas.getContext('2d').drawImage(img, pos.x * k, pos.y * k, size.w * k, size.h * k);
    setSaving(true);
    try {
      const blob = await new Promise((resolve, reject) => {
        try { canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('empty'))), 'image/jpeg', 0.9); } catch (err) { reject(err); }
      });
      await onSave(new File([blob], 'profile.jpg', { type: 'image/jpeg' }));
    } catch {
      setError('Could not save this photo. Try uploading it again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={!!src}
      onClose={saving ? () => {} : onCancel}
      title="Adjust profile photo"
      description="Drag the photo to reposition it, and use the slider to zoom."
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} loading={saving} disabled={!img}>Save photo</Button>
        </div>
      }
    >
      <div className="flex flex-col items-center gap-5 py-2">
        <div
          role="application"
          tabIndex={0}
          aria-label="Profile photo position. Drag, or use arrow keys to move and plus or minus to zoom."
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onKeyDown={onKeyDown}
          style={{ width: VIEW, height: VIEW }}
          className="relative shrink-0 cursor-grab touch-none select-none overflow-hidden rounded-full bg-line ring-1 ring-line-strong outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 focus-visible:ring-offset-raised active:cursor-grabbing"
        >
          {img ? (
            <img
              src={img.src}
              alt=""
              draggable={false}
              className="pointer-events-none absolute left-0 top-0 max-w-none"
              style={{ width: size.w, height: size.h, transform: `translate(${pos.x}px, ${pos.y}px)` }}
            />
          ) : !error && (
            <div className="flex size-full items-center justify-center">
              <Loader size={20} className="animate-spin text-ink-muted" />
            </div>
          )}
        </div>

        <label className="flex w-full max-w-64 items-center gap-3">
          <span className="sr-only">Zoom</span>
          <ZoomOut size={16} className="shrink-0 text-ink-muted" aria-hidden="true" />
          <input
            type="range"
            min={1}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            disabled={!img}
            onChange={(e) => changeZoom(Number(e.target.value))}
            className="w-full accent-brand-600"
          />
          <ZoomIn size={16} className="shrink-0 text-ink-muted" aria-hidden="true" />
        </label>

        {error && <p role="alert" className="text-xs text-danger-ink">{error}</p>}
      </div>
    </Modal>
  );
};

export default AvatarCropModal;
