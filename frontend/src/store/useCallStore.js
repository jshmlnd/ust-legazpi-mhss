import { create } from "zustand";
import { getSocket } from "../lib/socket";
import { axiosInstance } from "../lib/axios";
import { useChatStore } from "./useChatStore";
import toast from "react-hot-toast";

const RTC_CONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export const useCallStore = create((set, get) => ({
  callState: "idle", // idle | ringing | active | ended
  localStream: null,
  remoteStream: null,
  peerConnection: null,
  incomingCall: null, // { callerId, callerName, callerModel, socketId }
  peerId: null,
  isMuted: false,
  callDuration: 0,
  callTimer: null,

  initiateCall: async (calleeId) => {
    try {
      const localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const peerConnection = new RTCPeerConnection(RTC_CONFIG);

      localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream);
      });

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          const socket = getSocket();
          socket.emit("call:ice-candidate", {
            candidate: event.candidate,
            targetId: calleeId,
          });
        }
      };

      peerConnection.ontrack = (event) => {
        set({ remoteStream: event.streams[0] });
      };

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      const socket = getSocket();
      socket.emit("call:offer", {
        offer,
        calleeId,
        callerName: get().callerName,
      });

      set({
        callState: "ringing",
        localStream,
        peerConnection,
        peerId: calleeId,
        callerName: null,
      });

      get()._startTimer();
    } catch (error) {
      console.error("Failed to initiate call:", error);
      toast.error("Could not access microphone");
      get().cleanup();
    }
  },

  handleIncomingCall: (data) => {
    set({ incomingCall: data, callState: "ringing" });
  },

  acceptCall: async (data) => {
    try {
      const localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const peerConnection = new RTCPeerConnection(RTC_CONFIG);

      localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream);
      });

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          const socket = getSocket();
          socket.emit("call:ice-candidate", {
            candidate: event.candidate,
            targetId: data.callerId,
          });
        }
      };

      peerConnection.ontrack = (event) => {
        set({ remoteStream: event.streams[0] });
      };

      await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      const socket = getSocket();
      socket.emit("call:answer", {
        answer,
        callerId: data.callerId,
      });

      set({
        callState: "active",
        localStream,
        peerConnection,
        incomingCall: null,
        peerId: data.callerId,
      });

      get()._startTimer();
    } catch (error) {
      console.error("Failed to accept call:", error);
      toast.error("Could not access microphone");
      get().cleanup();
    }
  },

  handleCallAnswered: async (answer) => {
    const { peerConnection } = get();
    if (peerConnection) {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      set({ callState: "active" });
    }
  },

  handleIceCandidate: async (candidate) => {
    const { peerConnection } = get();
    if (peerConnection) {
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    }
  },

  rejectCall: () => {
    const { incomingCall } = get();
    if (incomingCall) {
      const socket = getSocket();
      socket.emit("call:rejected", { callerId: incomingCall.callerId });
    }
    set({ incomingCall: null, callState: "idle" });
  },

  endCall: (notifyPeer = true) => {
    const { peerId, callDuration, callState } = get();
    if (notifyPeer && peerId) {
      const socket = getSocket();
      socket.emit("call:ended", { targetId: peerId });
    }
    if (peerId) {
      const wasActive = callState === 'active';
      get()._logCall(peerId, wasActive ? callDuration : 0, wasActive);
    }
    get().cleanup();
  },

  handleCallEnded: () => {
    const { peerId, callDuration } = get();
    if (peerId) get()._logCall(peerId, callDuration);
    toast("Call ended");
    get().cleanup();
  },

  handleCallRejected: () => {
    const { peerId } = get();
    if (peerId) get()._logCall(peerId, 0);
    toast("Call rejected");
    get().cleanup();
  },

  toggleMute: () => {
    const { localStream, isMuted } = get();
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = isMuted;
      });
      set({ isMuted: !isMuted });
    }
  },

  _logCall: async (peerId, duration, wasActive = true) => {
    try {
      const text = wasActive
        ? `Voice call ended (${Math.floor(duration / 60)}m ${duration % 60}s)`
        : 'Call cancelled';
      const res = await axiosInstance.post(`/message/send/${peerId}`, {
        type: 'call-log',
        callDuration: duration,
        text,
      });
      const { selectedUser, messages } = useChatStore.getState();
      if (selectedUser && String(selectedUser._id) === String(peerId)) {
        useChatStore.setState({ messages: [...messages, res.data] });
      }
    } catch {
      // silently fail — call log is non-critical
    }
  },

  _startTimer: () => {
    const existing = get().callTimer;
    if (existing) clearInterval(existing);
    set({ callDuration: 0 });
    const timer = setInterval(() => {
      set((state) => ({ callDuration: state.callDuration + 1 }));
    }, 1000);
    set({ callTimer: timer });
  },

  cleanup: () => {
    const { localStream, peerConnection, callTimer } = get();
    if (callTimer) clearInterval(callTimer);
    if (localStream) localStream.getTracks().forEach((t) => t.stop());
    if (peerConnection) peerConnection.close();

    set({
      callState: "idle",
      localStream: null,
      remoteStream: null,
      peerConnection: null,
      incomingCall: null,
      peerId: null,
      isMuted: false,
      callDuration: 0,
      callTimer: null,
    });
  },

  subscribeToCallEvents: () => {
    const socket = getSocket();
    if (!socket) return;

    socket.off("call:initiated").on("call:initiated", (data) => {
      get().handleIncomingCall(data);
    });

    socket.off("call:answer").on("call:answer", async (data) => {
      await get().handleCallAnswered(data.answer);
    });

    socket.off("call:ice-candidate").on("call:ice-candidate", async (data) => {
      await get().handleIceCandidate(data.candidate);
    });

    socket.off("call:ended").on("call:ended", () => {
      get().handleCallEnded();
    });

    socket.off("call:rejected").on("call:rejected", () => {
      get().handleCallRejected();
    });
  },

  unsubscribeFromCallEvents: () => {
    const socket = getSocket();
    if (!socket) return;
    socket.off("call:initiated");
    socket.off("call:answer");
    socket.off("call:ice-candidate");
    socket.off("call:ended");
    socket.off("call:rejected");
  },
}));
