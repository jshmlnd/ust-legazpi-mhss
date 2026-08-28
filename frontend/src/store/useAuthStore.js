import { create } from "zustand";
import { axiosInstance } from "../lib/axios";

export const useAuthStore = create((set) => ({
    authUser: null,

    isSigningUp: false,
    isLoggingIn: false,
    isUpdating: false,

    isCheckingAuth: true,

    checkAuth: async () => {
        try {
            const res = await axiosInstance.get("/auth/check");
            set({ authUser: res.data });
        } catch {
            set({ authUser: null });
        } finally {
            set({ isCheckingAuth: false });
        }
    },

    login: async (studentId, password) => {
        set({ isLoggingIn: true });
        try {
            const res = await axiosInstance.post("/auth/login", { studentId, counselorId: studentId, password });
            if (res.data.twoFactorRequired) {
                return res.data;
            }
            set({ authUser: res.data });
            return res.data;
        } catch (error) {
            const message = error.response?.data?.message || "Login failed";
            throw new Error(message, { cause: error });
        } finally {
            set({ isLoggingIn: false });
        }
    },

    verifyTwoFactor: async (twoFactorToken, pin) => {
        const res = await axiosInstance.post("/auth/2fa/verify", { twoFactorToken, pin });
        set({ authUser: res.data });
        return res.data;
    },

    logout: async () => {
        try {
            await axiosInstance.post("/auth/logout");
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            set({ authUser: null });
        }
    },

    updateProfile: async (profilePic) => {
        set({ isUpdating: true });
        try {
            const res = await axiosInstance.put("/auth/profile", { profilePic });
            set({ authUser: res.data });
            return res.data;
        } catch (error) {
            const message = error.response?.data?.message || "Failed to update profile";
            throw new Error(message, { cause: error });
        } finally {
            set({ isUpdating: false });
        }
    },

    setTwoFactor: async (enabled, pin) => {
        const res = await axiosInstance.put("/auth/2fa", { enabled, pin });
        set((state) => ({
            authUser: { ...state.authUser, twoFactorEnabled: res.data.twoFactorEnabled },
        }));
        return res.data;
    },
}));