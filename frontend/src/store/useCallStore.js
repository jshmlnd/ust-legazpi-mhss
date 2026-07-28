import { create } from "zustand";
import AgoraRTC from "agora-rtc-sdk-ng";
import { getSocket } from "../lib/socket";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import toast from "react-hot-toast";

const generateChannelName = (userId1, userId2) => {
  const sorted = [String(userId1), String(userId2)].sort();
  return `mhss-${sorted[0]}-${sorted[1]}`;
};

const generateUid = (userId) => {
  let hash = 0;
  const str = String(userId);
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) || 1;
};

let agoraClient = null;

export const useCallStore = create((set, get) => ({
  callState: "idle", // idle | ringing | active | ended
  localAudioTrack: null,
  remoteUsers: [],
  incomingCall: null, // { callerId, callerName, callerModel, channelName }
  peerId: null,
  isMuted: false,
  callDuration: 0,
  callTimer: null,
  _logged: false,

  _getClient: () => {
    if (!agoraClient) {
      agoraClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

      agoraClient.on("user-published", async (user, mediaType) => {
        try {
          await agoraClient.subscribe(user, mediaType);
          console.log("[Agora] subscribed to uid:", user.uid, "type:", mediaType);
        } catch (err) {
          console.error("[Agora] subscribe failed for uid", user.uid, err);
          return;
        }

        if (mediaType === "audio") {
          const attemptPlay = (retries = 5) => {
            const remote = agoraClient?.remoteUsers.find((u) => u.uid === user.uid);
            const track = remote?.audioTrack;
            if (!track) {
              if (retries > 0) setTimeout(() => attemptPlay(retries - 1), 300);
              return;
            }
            track.play().then(() => {
              console.log("[Agora] remote audio playing, uid:", user.uid);
            }).catch((err) => {
              console.warn("[Agora] audio play failed, retrying...", err.message);
              if (retries > 0) setTimeout(() => attemptPlay(retries - 1), 500);
            });
          };
          attemptPlay();
        }

        set((state) => {
          const exists = state.remoteUsers.find((u) => u.uid === user.uid);
          if (exists) {
            return {
              remoteUsers: state.remoteUsers.map((u) =>
                u.uid === user.uid ? user : u
              ),
            };
          }
          return { remoteUsers: [...state.remoteUsers, user] };
        });
      });

      agoraClient.on("user-unpublished", (user, mediaType) => {
        if (mediaType === "audio") {
          user.audioTrack?.stop();
        }
      });

      agoraClient.on("user-joined", (user) => {
        console.log("[Agora] remote user joined:", user.uid);
      });

      agoraClient.on("user-left", (user) => {
        console.log("[Agora] remote user left:", user.uid);
        set((state) => ({
          remoteUsers: state.remoteUsers.filter((u) => u.uid !== user.uid),
        }));
      });
    }
    return agoraClient;
  },

  _getChannelName: (peerId) => {
    const { authUser } = useAuthStore.getState();
    return generateChannelName(authUser._id, peerId);
  },

  _getUid: () => {
    const { authUser } = useAuthStore.getState();
    return generateUid(authUser._id);
  },

  _fetchToken: async (channelName) => {
    const uid = get()._getUid();
    try {
      const res = await axiosInstance.post("/agora/token", { channelName, uid });
      return res.data;
    } catch (err) {
      const detail = err.response?.data?.error || err.message;
      throw new Error(`Token fetch failed: ${detail}`, { cause: err });
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

  _logCall: async (peerId, duration, wasActive = true) => {
    if (get()._logged) return;
    set({ _logged: true });
    try {
      await axiosInstance.post('/call-logs', {
        receiverId: peerId,
        duration,
        status: wasActive ? 'ended' : 'cancelled',
      });
    } catch {
      // silently fail
    }
  },

  initiateCall: async (calleeId) => {
    try {
      const channelName = get()._getChannelName(calleeId);
      console.log("[Agora] initiating call to", calleeId, "channel:", channelName);

      const client = get()._getClient();
      console.log("[Agora] client created");

      const { token, appId } = await get()._fetchToken(channelName);
      console.log("[Agora] token fetched, appId:", appId);

      const uid = get()._getUid();
      console.log("[Agora] uid:", uid);

      await client.join(appId, channelName, token, uid);
      console.log("[Agora] joined channel");

      const localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      console.log("[Agora] mic track created");

      await client.publish([localAudioTrack]);
      console.log("[Agora] published");

      const socket = getSocket();
      socket.emit("call:offer", {
        calleeId,
        callerName: useAuthStore.getState().authUser.fullName,
        channelName,
      });

      set({
        callState: "ringing",
        localAudioTrack,
        peerId: calleeId,
      });

      get()._startTimer();
    } catch (error) {
      console.error("[Agora] Failed to initiate call:", error);
      toast.error(`Call failed: ${error.message || "Unknown error"}`);
      await get().cleanup();
    }
  },

  handleIncomingCall: (data) => {
    set({ incomingCall: data, callState: "ringing" });
  },

  acceptCall: async (data) => {
    try {
      const client = get()._getClient();
      const { token, appId } = await get()._fetchToken(data.channelName);
      const uid = get()._getUid();
      console.log("[Agora] accepting call, channel:", data.channelName, "uid:", uid);

      await client.join(appId, data.channelName, token, uid);
      console.log("[Agora] joined channel");

      const localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      console.log("[Agora] mic track created");
      await client.publish([localAudioTrack]);
      console.log("[Agora] published");

      const socket = getSocket();
      socket.emit("call:answer", {
        callerId: data.callerId,
        channelName: data.channelName,
      });

      set({
        callState: "active",
        localAudioTrack,
        incomingCall: null,
        peerId: data.callerId,
      });

      get()._startTimer();
    } catch (error) {
      console.error("Failed to accept call:", error);
      const msg = error.message?.includes("microphone") || error.message?.includes("NotAllowed")
        ? "Microphone access denied. Please allow microphone access and try again."
        : "Could not join call. Please try again.";
      toast.error(msg);
      await get().cleanup();
    }
  },

  handleCallAnswered: async () => {
    set({ callState: "active" });
  },

  rejectCall: () => {
    const { incomingCall } = get();
    if (incomingCall) {
      const socket = getSocket();
      socket.emit("call:rejected", { callerId: incomingCall.callerId });
    }
    set({ incomingCall: null, callState: "idle" });
  },

  endCall: async (notifyPeer = true) => {
    const { peerId, callDuration, callState } = get();
    if (notifyPeer && peerId) {
      const socket = getSocket();
      socket.emit("call:ended", { targetId: peerId });
    }
    if (peerId) {
      const wasActive = callState === "active";
      await get()._logCall(peerId, wasActive ? callDuration : 0, wasActive);
    }
    await get().cleanup();
  },

  handleCallEnded: async () => {
    await get().cleanup();
    toast("Call ended");
  },

  handleCallRejected: async () => {
    await get().cleanup();
    toast("Call rejected");
  },

  toggleMute: () => {
    const { localAudioTrack, isMuted } = get();
    if (localAudioTrack) {
      localAudioTrack.setMuted(!isMuted);
      set({ isMuted: !isMuted });
    }
  },

  cleanup: async () => {
    const { localAudioTrack, callTimer } = get();
    if (callTimer) clearInterval(callTimer);
    if (localAudioTrack) {
      localAudioTrack.close();
    }
    if (agoraClient) {
      try { await agoraClient.leave(); } catch (e) { console.warn("Agora leave failed:", e); }
      agoraClient = null;
    }

    set({
      callState: "idle",
      localAudioTrack: null,
      remoteUsers: [],
      incomingCall: null,
      peerId: null,
      isMuted: false,
      callDuration: 0,
      callTimer: null,
      _logged: false,
    });
  },

  subscribeToCallEvents: () => {
    const socket = getSocket();
    if (!socket) return;

    socket.off("call:initiated").on("call:initiated", (data) => {
      get().handleIncomingCall(data);
    });

    socket.off("call:answer").on("call:answer", async (data) => {
      await get().handleCallAnswered(data);
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
    socket.off("call:ended");
    socket.off("call:rejected");
  },
}));
