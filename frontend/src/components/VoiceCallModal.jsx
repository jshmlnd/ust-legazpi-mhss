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
    callState, incomingCall, isMuted, callDuration, remoteStream,
    acceptCall, rejectCall, endCall, toggleMute,
  } = useCallStore();

  const audioRef = useRef(null);
  const ringRef = useRef(null);

  useEffect(() => {
    if (audioRef.current && remoteStream) {
      audioRef.current.srcObject = remoteStream;
      audioRef.current.play().catch(() => {});
    }
  }, [remoteStream]);

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
  }, [callState]);

  if (callState === 'idle') return null;

  const isIncoming = callState === 'ringing' && incomingCall;
  const displayName = isIncoming
    ? (incomingCall.callerName || `User ${incomingCall.callerId}`)
    : peerName;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <audio ref={audioRef} autoPlay />
      <audio ref={ringRef} src="/ring.mp3" loop />

      <div className="bg-white rounded-sm shadow-xl w-full max-w-sm mx-4 overflow-hidden">
        {isIncoming ? (
          /* ─── Incoming Call ─── */
          <div className="flex flex-col items-center py-10 px-6">
            <div className="size-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4 animate-pulse">
              <Phone size={24} className="text-neutral-700" />
            </div>
            <p className="text-sm font-medium text-neutral-900">{displayName}</p>
            <p className="text-xs text-neutral-400 mt-1 mb-8">Incoming voice call...</p>
            <div className="flex items-center gap-4">
              <button
                onClick={rejectCall}
                className="size-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white transition-colors"
              >
                <PhoneOff size={20} />
              </button>
              <button
                onClick={() => acceptCall(incomingCall)}
                className="size-14 rounded-full bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center text-white transition-colors"
              >
                <Phone size={20} />
              </button>
            </div>
          </div>
        ) : callState === 'ringing' ? (
          /* ─── Outgoing Ringing ─── */
          <div className="flex flex-col items-center py-10 px-6">
            <div className="size-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
              <Phone size={24} className="text-neutral-700 animate-pulse" />
            </div>
            <p className="text-sm font-medium text-neutral-900">{displayName}</p>
            <p className="text-xs text-neutral-400 mt-1 mb-8">Calling...</p>
            <button
              onClick={() => endCall(true)}
              className="size-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white transition-colors"
            >
              <PhoneOff size={20} />
            </button>
          </div>
        ) : (
          /* ─── Active Call ─── */
          <div className="flex flex-col items-center py-10 px-6">
            <div className="size-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
              <Phone size={24} className="text-emerald-600" />
            </div>
            <p className="text-sm font-medium text-neutral-900">{displayName}</p>
            <p className="text-xs text-emerald-600 font-medium mt-1 mb-2">
              {formatDuration(callDuration)}
            </p>
            <p className="text-[11px] text-neutral-400 mb-8">Voice Call Active</p>
            <div className="flex items-center gap-4">
              <button
                onClick={toggleMute}
                className={`size-12 rounded-full flex items-center justify-center transition-colors ${
                  isMuted
                    ? 'bg-red-100 text-red-600 hover:bg-red-200'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
              <button
                onClick={() => endCall(true)}
                className="size-12 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white transition-colors"
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
