import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

const ImageLightbox = ({ images, index, onClose }) => {
  const [current, setCurrent] = useState(index);

  const prev = useCallback(() => setCurrent((i) => (i > 0 ? i - 1 : images.length - 1)), [images.length]);
  const next = useCallback(() => setCurrent((i) => (i < images.length - 1 ? i + 1 : 0)), [images.length]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose, prev, next]);

  const media = images[current];
  const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(media);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-side/80" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 text-brand-fg/70 hover:text-brand-fg transition-colors z-10">
        <X size={24} />
      </button>

      {images.length > 1 && (
        <>
          <button onClick={(e) => { e.stopPropagation(); prev(); }} className="absolute left-4 text-brand-fg/70 hover:text-brand-fg transition-colors z-10">
            <ChevronLeft size={32} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); next(); }} className="absolute right-4 text-brand-fg/70 hover:text-brand-fg transition-colors z-10">
            <ChevronRight size={32} />
          </button>
        </>
      )}

      <div className="max-w-[90vw] max-h-[85vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        {isVideo ? (
          <video src={media} controls autoPlay className="max-w-full max-h-[85vh] rounded-lg" />
        ) : (
          <img src={media} alt="" className="max-w-full max-h-[85vh] object-contain rounded-lg" />
        )}
      </div>

      {images.length > 1 && (
        <div className="absolute bottom-4 text-brand-fg/60 text-xs font-medium">
          {current + 1} / {images.length}
        </div>
      )}
    </div>
  );
};

export default ImageLightbox;
