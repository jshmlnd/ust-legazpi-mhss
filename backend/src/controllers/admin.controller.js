import User from "../models/user.model.js";
import Counselor from "../models/counselor.model.js";

export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error("Error in getUsers:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getCounselors = async (req, res) => {
  try {
    const counselors = await Counselor.find().select("-password").sort({ createdAt: -1 });
    res.json(counselors);
  } catch (error) {
    console.error("Error in getCounselors:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { password, ...updates } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (error) {
    console.error("Error in updateUser:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateCounselor = async (req, res) => {
  try {
    const { password, ...updates } = req.body;
    const counselor = await Counselor.findByIdAndUpdate(req.params.id, updates, { new: true }).select("-password");
    if (!counselor) return res.status(404).json({ error: "Counselor not found" });
    res.json(counselor);
  } catch (error) {
    console.error("Error in updateCounselor:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ message: "User deleted" });
  } catch (error) {
    console.error("Error in deleteUser:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteCounselor = async (req, res) => {
  try {
    const counselor = await Counselor.findByIdAndDelete(req.params.id);
    if (!counselor) return res.status(404).json({ error: "Counselor not found" });
    res.json({ message: "Counselor deleted" });
  } catch (error) {
    console.error("Error in deleteCounselor:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
