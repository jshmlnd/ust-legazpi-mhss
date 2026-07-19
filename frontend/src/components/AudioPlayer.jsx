import { useEffect, useRef } from 'react';
import { useCallStore } from '../store/useCallStore';

const AudioPlayer = () => {
  const remoteStream = useCallStore((s) => s.remoteStream);
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current && remoteStream) {
      ref.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  return <audio ref={ref} autoPlay className="hidden" />;
};

export default AudioPlayer;
