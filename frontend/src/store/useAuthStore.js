import { create } from "zustand";
import { axiosInstance } from "../lib/axios";

export const useAuthStore = create((set) => ({
    authUser: null,
    error: null,

    isSigningUp: false,
    isLoggingIn: false,
    isUpdating: false,

    isCheckingAuth: true,

    checkAuth: async () => {
        try {
            const res = await axiosInstance.get("/auth/check");
            set({ authUser: res.data });
        } catch (error) {
            set({ authUser: null });
        } finally {
            set({ isCheckingAuth: false });
        }
    },

    login: async (data) => {
        set({ isLoggingIn: true, error: null });
        try {
            const res = await axiosInstance.post("/auth/login", data);
            set({ authUser: res.data });
        } catch (error) {
            set({ error: error.response?.data?.message || "Login failed" });
        } finally {
            set({ isLoggingIn: false });
        }
    },

    logout: async () => {
        try {
            await axiosInstance.post("/auth/logout");
            set({ authUser: null });
        } catch (error) {
            console.log("Error in logout: ", error.message);
        }
    },
}));
