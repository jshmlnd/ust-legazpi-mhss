import { useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff } from 'lucide-react';
import { useCallStore } from '../store/useCallStore';

const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const VoiceCallModal = ({ peerName }) => {
  const {
    callState, incomingCall, isMuted, callDuration,
    acceptCall, rejectCall, endCall, toggleMute,
  } = useCallStore();

  const ringRef = useRef(null);

  useEffect(() => {
    const ring = ringRef.current;
    if (!ring) return;
    if (callState === 'ringing') {
      ring.currentTime = 0;
      ring.play().catch(() => {});
    } else {
      ring.pause();
      ring.currentTime = 0;
    }
    // Unmount (cleanup()) removes the <audio> node while play() may still
    // be resolving — pause it here so the promise settles quietly.
    return () => {
      ring.pause();
      ring.currentTime = 0;
    };
  }, [callState]);

  if (callState === 'idle') return null;

  const isIncoming = callState === 'ringing' && incomingCall;
  const displayName = isIncoming
    ? (incomingCall.callerName || `User ${incomingCall.callerId}`)
    : peerName;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isIncoming ? 'Incoming voice call' : callState === 'ringing' ? 'Calling' : 'Voice call in progress'}
      className="fixed inset-0 z-50 flex items-center justify-center bg-side/50"
    >
      <audio ref={ringRef} src="/ring.mp3" loop />

      <div className="bg-surface rounded-lg shadow-xl w-full max-w-sm mx-4 overflow-hidden">
        {isIncoming ? (
          <div className="flex flex-col items-center py-10 px-6">
            <div className="size-16 rounded-full bg-line flex items-center justify-center mb-4 animate-pulse">
              <Phone size={24} className="text-ink-soft" />
            </div>
            <p className="text-sm font-medium text-ink">{displayName}</p>
            <p className="text-xs text-ink-muted mt-1 mb-8">Incoming voice call...</p>
            <div className="flex items-center gap-4">
              <button
                onClick={rejectCall}
                className="size-14 rounded-full bg-danger hover:bg-danger/90 flex items-center justify-center text-brand-fg transition-colors"
              >
                <PhoneOff size={20} />
              </button>
              <button
                onClick={() => acceptCall(incomingCall)}
                className="size-14 rounded-full bg-brand-600 hover:bg-brand-700 flex items-center justify-center text-brand-fg transition-colors"
              >
                <Phone size={20} />
              </button>
            </div>
          </div>
        ) : callState === 'ringing' ? (
          <div className="flex flex-col items-center py-10 px-6">
            <div className="size-16 rounded-full bg-line flex items-center justify-center mb-4">
              <Phone size={24} className="text-ink-soft animate-pulse" />
            </div>
            <p className="text-sm font-medium text-ink">{displayName}</p>
            <p className="text-xs text-ink-muted mt-1 mb-8">Calling...</p>
            <button
              onClick={() => endCall(true)}
              className="size-14 rounded-full bg-danger hover:bg-danger/90 flex items-center justify-center text-brand-fg transition-colors"
            >
              <PhoneOff size={20} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center py-10 px-6">
            <div className="size-16 rounded-full bg-brand-soft flex items-center justify-center mb-4">
              <Phone size={24} className="text-brand-soft-ink" />
            </div>
            <p className="text-sm font-medium text-ink">{displayName}</p>
            <p className="text-xs text-brand-soft-ink font-medium mt-1 mb-2">
              {formatDuration(callDuration)}
            </p>
            <p className="text-xs text-ink-muted mb-8">Voice Call Active</p>
            <div className="flex items-center gap-4">
              <button
                onClick={toggleMute}
                className={`size-12 rounded-full flex items-center justify-center transition-colors ${
                  isMuted
                    ? 'bg-danger-soft text-danger-ink hover:bg-danger-soft'
                    : 'bg-line text-ink-soft hover:bg-line'
                }`}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
              <button
                onClick={() => endCall(true)}
                className="size-12 rounded-full bg-danger hover:bg-danger/90 flex items-center justify-center text-brand-fg transition-colors"
              >
                <PhoneOff size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceCallModal;
