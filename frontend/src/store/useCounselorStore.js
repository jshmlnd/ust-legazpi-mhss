import { create } from "zustand";
import { axiosInstance } from "../lib/axios";

export const useCounselorStore = create((set) => ({
  stats: null,
  students: [],
  currentStudent: null,
  isLoading: false,
  error: null,

  fetchStats: async () => {
    try {
      const res = await axiosInstance.get("/counselor/stats");
      set({ stats: res.data });
    } catch (error) {
      console.log("Error fetching stats:", error.message);
    }
  },

  fetchStudents: async () => {
    try {
      const res = await axiosInstance.get("/counselor/students");
      set({ students: res.data });
    } catch (error) {
      console.log("Error fetching students:", error.message);
    }
  },

  fetchStudentById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axiosInstance.get(`/counselor/students/${id}`);
      set({ currentStudent: res.data });
    } catch (error) {
      console.log("Error fetching student:", error.message);
      set({ error: error.response?.data?.message || "Failed to fetch student" });
    } finally {
      set({ isLoading: false });
    }
  },
}));
