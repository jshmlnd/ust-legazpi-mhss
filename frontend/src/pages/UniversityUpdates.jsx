import { useState, useEffect, useRef, useCallback } from 'react';
import { Megaphone, Send, Clock, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { axiosInstance } from '../lib/axios';
import { getSocket } from '../lib/socket';
import { useAuthStore } from '../store/useAuthStore';
import PageShell from '../components/PageShell';
import { PageShellSkeleton } from '../components/skeleton';
import RoleGate from '../components/RoleGate';
import EmptyState from '../components/EmptyState';
import toast from 'react-hot-toast';

const REACTIONS = [
  { emoji: '👍', key: 'like', label: 'Like' },
  { emoji: '❤️', key: 'love', label: 'Love' },
  { emoji: '😊', key: 'laugh', label: 'Laugh' },
  { emoji: '😮', key: 'surprise', label: 'Surprise' },
  { emoji: '😢', key: 'sad', label: 'Sad' },
];

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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors z-10">
        <X size={24} />
      </button>

      {images.length > 1 && (
        <>
          <button onClick={(e) => { e.stopPropagation(); prev(); }} className="absolute left-4 text-white/70 hover:text-white transition-colors z-10">
            <ChevronLeft size={32} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); next(); }} className="absolute right-4 text-white/70 hover:text-white transition-colors z-10">
            <ChevronRight size={32} />
          </button>
        </>
      )}

      <div className="max-w-[90vw] max-h-[85vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        {isVideo ? (
          <video src={media} controls autoPlay className="max-w-full max-h-[85vh] rounded-sm" />
        ) : (
          <img src={media} alt="" className="max-w-full max-h-[85vh] object-contain rounded-sm" />
        )}
      </div>

      {images.length > 1 && (
        <div className="absolute bottom-4 text-white/60 text-xs font-medium">
          {current + 1} / {images.length}
        </div>
      )}
    </div>
  );
};

const UpdateCard = ({ update, currentUserId, onReact }) => {
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const date = update.createdAt ? new Date(update.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : update.date;
  const time = update.createdAt ? new Date(update.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <div className="bg-white border border-neutral-200 rounded-sm p-6">
      <div className="flex items-start gap-4">
        <div className="hidden sm:flex flex-col items-center gap-1.5 pt-0.5">
          <div className="size-9 rounded-sm bg-neutral-100 flex items-center justify-center text-neutral-500">
            <Megaphone size={16} />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="text-sm font-medium text-neutral-900">{update.title}</h3>
            <span className="text-[10px] font-medium text-neutral-400 shrink-0">{date}</span>
          </div>
          <p className="text-xs text-neutral-600 leading-relaxed mb-3">{update.body}</p>
          {update.images && update.images.length > 0 && (
            <div className={`grid gap-1.5 mb-3 ${
              update.images.length === 1 ? 'grid-cols-1'
                : update.images.length === 2 ? 'grid-cols-2'
                  : update.images.length === 3 ? 'grid-cols-3'
                    : 'grid-cols-2'
            }`}>
              {update.images.map((media, i) => {
                const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(media);
                const isThree = update.images.length === 3 && i === 0;
                const thumbnail = (
                  isVideo ? (
                    <video src={media} className="w-full h-full object-cover" />
                  ) : (
                    <img src={media} alt="" loading="lazy" className="w-full h-full object-cover" />
                  )
                );
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setLightboxIndex(i)}
                    className={`block rounded-sm border border-neutral-200 overflow-hidden hover:border-neutral-400 transition-colors cursor-pointer bg-neutral-50 ${
                      isThree ? 'row-span-2' : ''
                    }`}
                  >
                    {isThree ? (
                      <div className="h-full min-h-[268px]">{thumbnail}</div>
                    ) : thumbnail}
                  </button>
                );
              })}
            </div>
          )}

          {lightboxIndex !== null && (
            <ImageLightbox
              images={update.images}
              index={lightboxIndex}
              onClose={() => setLightboxIndex(null)}
            />
          )}
          <div className="flex items-center gap-4 text-[10px] text-neutral-400">
            <span className="font-medium">{update.author}</span>
            {time && <span className="flex items-center gap-1"><Clock size={10} /> {time}</span>}
            {update.views !== undefined && <span className="flex items-center gap-1">{update.views} views</span>}
          </div>

          <div className="flex items-center gap-1.5 mt-4 pt-4 border-t border-neutral-100">
            {REACTIONS.map((r) => {
              const users = (update.reactions && update.reactions[r.key]) || [];
              const count = users.length;
              const isActive = users.includes(currentUserId);
              return (
                <button
                  key={r.key}
                  onClick={() => onReact(update._id, r.key)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-sm border transition-colors ${
                    isActive
                      ? 'bg-neutral-100 border-neutral-300 text-neutral-900'
                      : 'border-neutral-200 text-neutral-500 hover:border-neutral-300 hover:text-neutral-700'
                  }`}
                  title={r.label}
                >
                  <span className="text-sm leading-none">{r.emoji}</span>
                  {count > 0 && <span className="font-medium text-[11px]">{count}</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

const AnnouncementComposer = ({ onPost }) => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    try {
      const res = await onPost({ title: title.trim(), body: body.trim(), author: 'Counseling Office' });
      if (res) { setTitle(''); setBody(''); }
    } catch {
      // error handled by parent
    }
  };

  return (
    <RoleGate roles={['counselor']}>
      <div className="bg-white border border-neutral-200 rounded-sm p-6 mb-6">
        <span className="text-[11px] font-semibold tracking-[0.1em] uppercase text-neutral-500 mb-4 block">Compose Announcement</span>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Announcement title..."
            className="w-full bg-transparent border border-neutral-200 text-sm rounded-sm px-3 py-2.5 text-neutral-900 placeholder-neutral-400 focus:border-neutral-900 outline-none transition-colors"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your announcement..."
            rows={3}
            className="w-full bg-transparent border border-neutral-200 text-sm rounded-sm px-3 py-2.5 text-neutral-900 placeholder-neutral-400 focus:border-neutral-900 outline-none transition-colors resize-none"
          />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-neutral-400">Posted instantly to all students</span>
            <button type="submit" className="inline-flex items-center gap-2 px-4 py-2 text-[11px] font-semibold tracking-[0.1em] uppercase text-white bg-neutral-900 hover:bg-neutral-800 transition-colors rounded-sm">
              <Send size={12} /> Broadcast
            </button>
          </div>
        </form>
      </div>
    </RoleGate>
  );
};

const UniversityUpdates = () => {
  const { authUser } = useAuthStore();
  const currentUserId = authUser?._id;
  const role = authUser?.userType?.toLowerCase() ?? null;
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const viewedRef = useRef(new Set());

  useEffect(() => {
    const fetchUpdates = async () => {
      try {
        const res = await axiosInstance.get('/announcements');
        setUpdates(res.data);
        res.data.forEach((a) => {
          if (!viewedRef.current.has(a._id)) {
            viewedRef.current.add(a._id);
            axiosInstance.patch(`/announcements/${a._id}/views`).catch(() => {});
          }
        });
      } catch (err) {
        console.error('Failed to fetch announcements:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUpdates();
    const socket = getSocket();
    socket?.on('announcements:updated', fetchUpdates);
    return () => socket?.off('announcements:updated', fetchUpdates);
  }, []);

  const handlePost = async (post) => {
    try {
      const res = await axiosInstance.post('/announcements', post);
      setUpdates((prev) => [res.data, ...prev]);
      toast.success('Announcement posted');
      return res.data;
    } catch (err) {
      toast.error('Failed to post announcement');
      throw err;
    }
  };

  const handleReact = async (id, emoji) => {
    try {
      const res = await axiosInstance.post(`/announcements/${id}/react`, { emoji });
      setUpdates((prev) => prev.map((u) => (u._id === id ? res.data : u)));
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to update reaction';
      toast.error(msg);
    }
  };

  if (loading) return <PageShell title="University Updates" subtitle="Campus announcements, wellness alerts & seminar listings"><PageShellSkeleton count={4} /></PageShell>;

  return (
    <PageShell title="University Updates" subtitle="Campus announcements, wellness alerts & seminar listings">
      <AnnouncementComposer onPost={handlePost} />

      {updates.length === 0 ? (
        <EmptyState icon={Megaphone} title="No announcements yet" description={role === 'counselor' ? 'Post your first campus announcement using the composer above.' : 'Check back for new updates.'} />
      ) : (
        <div className="relative">
          <div className="absolute left-[22px] sm:left-[23px] top-0 bottom-0 w-px bg-neutral-200 hidden sm:block" />
          <div className="space-y-4">
            {updates.map((u, i) => (
              <div key={u._id} className="relative">
                {i > 0 && <div className="hidden sm:block absolute -left-[25px] top-6 size-[10px] rounded-full bg-white border-2 border-neutral-300" />}
                <UpdateCard update={u} currentUserId={currentUserId} onReact={handleReact} />
              </div>
            ))}
          </div>
        </div>
      )}
    </PageShell>
  );
};

export default UniversityUpdates;
