import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import Counselor from "../models/counselor.model.js";

const router = express.Router();

// Get all students
router.get("/students", protectRoute, async (req, res) => {
  try {
    const students = await User.find().select("-password");
    res.status(200).json(students);
  } catch (error) {
    console.log("Error fetching students: ", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get single student by ID
router.get("/students/:id", protectRoute, async (req, res) => {
  try {
    const student = await User.findById(req.params.id).select("-password");
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.status(200).json(student);
  } catch (error) {
    console.log("Error fetching student: ", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get dashboard stats
router.get("/stats", protectRoute, async (req, res) => {
  try {
    const counselorId = req.user._id;

    const totalStudents = await User.countDocuments();
    const unreadMessages = await Message.countDocuments({
      receiverId: counselorId,
      receiverModel: "Counselor",
    });

    // Recent activity — last 10 messages involving this counselor
    const recentActivity = await Message.find({
      $or: [
        { senderId: counselorId, senderModel: "Counselor" },
        { receiverId: counselorId, receiverModel: "Counselor" },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("senderId", "fullName studentId")
      .populate("receiverId", "fullName studentId");

    const formattedActivity = recentActivity.map((msg) => ({
      _id: msg._id,
      text: msg.text?.substring(0, 80) || (msg.image ? "[Image]" : ""),
      createdAt: msg.createdAt,
      otherUser:
        msg.senderId?._id?.toString() === counselorId.toString()
          ? msg.receiverId
          : msg.senderId,
      direction:
        msg.senderId?._id?.toString() === counselorId.toString()
          ? "sent"
          : "received",
    }));

    res.status(200).json({
      totalStudents,
      unreadMessages,
      pendingRequests: 0,
      todayAppointments: 0,
      recentActivity: formattedActivity,
    });
  } catch (error) {
    console.log("Error fetching stats: ", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get all counselors
router.get("/list", protectRoute, async (req, res) => {
  try {
    const counselors = await Counselor.find().select("-password");
    res.status(200).json(counselors);
  } catch (error) {
    console.log("Error fetching counselors: ", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;

