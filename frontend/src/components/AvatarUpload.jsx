import { useState, useRef } from 'react';
import { User, Camera, X, Loader, Check } from 'lucide-react';

const AvatarUpload = ({ profilePic, fullName, onUpload, onRemove, size = 'lg' }) => {
  const [preview, setPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const sizeClasses = {
    sm: 'size-10',
    md: 'size-16',
    lg: 'size-24',
  };

  const iconSizes = { sm: 14, md: 18, lg: 28 };

  const handleClick = () => {
    if (loading) return;
    if (selectedFile) {
      setPreview(null);
      setSelectedFile(false);
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
      setSelectedFile(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSave = async () => {
    if (!preview) return;
    setLoading(true);
    try {
      await onUpload(preview);
      setSelectedFile(false);
      setPreview(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (e) => {
    e.stopPropagation();
    setLoading(true);
    try {
      await onRemove();
    } finally {
      setLoading(false);
    }
  };

  const displaySrc = preview || profilePic || null;

  return (
    <div className="relative group">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <button
        type="button"
        onClick={handleClick}
        className={`${sizeClasses[size]} rounded-full overflow-hidden bg-line flex items-center justify-center transition-all hover:ring-2 hover:ring-line-strong cursor-pointer`}
      >
        {displaySrc ? (
          <img src={displaySrc} alt={fullName || 'Profile'} className="w-full h-full object-cover" />
        ) : (
          <User size={iconSizes[size]} className="text-ink-muted" />
        )}

        {!selectedFile && !loading && (
          <div className="absolute inset-0 rounded-full bg-side/40 opacity-0 group-hover:opacity-100 max-md:opacity-100 transition-opacity flex items-center justify-center">
            <Camera size={iconSizes[size] > 20 ? 20 : 14} className="text-ink" />
          </div>
        )}
      </button>

      {profilePic && !selectedFile && !loading && (
        <button
          type="button"
          onClick={handleRemove}
          className="absolute -top-1 -right-1 size-5 rounded-full bg-danger-soft0 text-ink flex items-center justify-center hover:bg-danger transition-colors"
          title="Remove profile picture"
        >
          <X size={10} />
        </button>
      )}

      {selectedFile && (
        <div className="absolute -bottom-1 -right-1 flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleSave(); }}
            disabled={loading}
            className="size-6 rounded-full bg-brand-soft text-ink flex items-center justify-center hover:bg-brand-600 transition-colors"
            title="Save"
          >
            {loading ? <Loader size={10} className="animate-spin" /> : <Check size={10} />}
          </button>
          <button
            type="button"
            onClick={handleClick}
            disabled={loading}
            className="size-6 rounded-full bg-ink-muted text-ink flex items-center justify-center hover:bg-ink-soft transition-colors"
            title="Cancel"
          >
            <X size={10} />
          </button>
        </div>
      )}
    </div>
  );
};

export default AvatarUpload;
