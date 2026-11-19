import { useState, useRef } from 'react';
import { User, Camera, X, Loader, Move } from 'lucide-react';
import AvatarCropModal from './modals/AvatarCropModal';

const AvatarUpload = ({ profilePic, fullName, onUpload, onRemove, size = 'lg' }) => {
  const [cropSrc, setCropSrc] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const sizeClasses = {
    sm: 'size-10',
    md: 'size-16',
    lg: 'size-24',
  };

  const iconSizes = { sm: 14, md: 18, lg: 28 };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !file.type.startsWith('image/') || file.size > 10 * 1024 * 1024) return;

    const reader = new FileReader();
    reader.onloadend = () => setCropSrc(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async (file) => {
    setLoading(true);
    try {
      await onUpload(file);
      setCropSrc(null);
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
        onClick={() => !loading && fileInputRef.current?.click()}
        aria-label={profilePic ? 'Change profile photo' : 'Upload profile photo'}
        className={`${sizeClasses[size]} rounded-full overflow-hidden bg-line flex items-center justify-center transition-all hover:ring-2 hover:ring-line-strong cursor-pointer`}
      >
        {profilePic ? (
          <img src={profilePic} alt={fullName || 'Profile'} className="w-full h-full object-cover" />
        ) : (
          <User size={iconSizes[size]} className="text-ink-muted" />
        )}

        <div className={`absolute inset-0 rounded-full bg-side/40 flex items-center justify-center transition-opacity ${loading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 max-md:opacity-100'}`}>
          {loading
            ? <Loader size={18} className="animate-spin text-ink" />
            : <Camera size={iconSizes[size] > 20 ? 20 : 14} className="text-ink" />}
        </div>
      </button>

      {profilePic && !loading && (
        <>
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-1 -right-1 size-6 rounded-full border border-line bg-raised text-ink-muted shadow-e1 flex items-center justify-center hover:text-danger-ink hover:border-danger/40 transition-colors"
            title="Remove profile photo"
            aria-label="Remove profile photo"
          >
            <X size={12} />
          </button>
          <button
            type="button"
            onClick={() => setCropSrc(profilePic)}
            className="absolute -bottom-1 -right-1 size-6 rounded-full border border-line bg-raised text-ink-muted shadow-e1 flex items-center justify-center hover:text-ink hover:border-line-strong transition-colors"
            title="Adjust photo position"
            aria-label="Adjust photo position"
          >
            <Move size={12} />
          </button>
        </>
      )}

      <AvatarCropModal src={cropSrc} onCancel={() => setCropSrc(null)} onSave={handleSave} />
    </div>
  );
};

export default AvatarUpload;
