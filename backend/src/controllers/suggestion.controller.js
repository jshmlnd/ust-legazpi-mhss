import Suggestion from "../models/suggestion.model.js";
import User from "../models/user.model.js";
import { getDailyDynamicId } from "../lib/generateId.js";

export const getSuggestions = async (req, res) => {
  try {
    const filter = req.user.constructor.modelName === "Counselor"
      ? { isDeleted: { $ne: true } }
      : { studentId: req.user._id, isDeleted: { $ne: true } };
    const suggestions = await Suggestion.find(filter).sort({ createdAt: -1 });

    let result = suggestions;
    if (req.user.constructor.modelName === "Counselor") {
      const studentIds = [...new Set(suggestions.map((s) => s.studentId))];
      const students = await User.find({ _id: { $in: studentIds } }).select("dynamicId").lean();
      const dynamicMap = Object.fromEntries(students.map((s) => [String(s._id), s.dynamicId]));
      result = suggestions.map((s) => ({
        ...s.toObject(),
        studentDynamicId: getDailyDynamicId(dynamicMap[String(s.studentId)]) || null,
      }));
    }

    res.json(result);
  } catch (error) {
    console.error("Error in getSuggestions:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createSuggestion = async (req, res) => {
  try {
    const message = typeof req.body.message === "string" ? req.body.message.trim() : "";
    if (!message || message.length > 4000) {
      return res.status(400).json({ error: "Please write a message (up to 4000 characters)." });
    }
    const suggestion = new Suggestion({ studentId: req.user._id, message });
    await suggestion.save();
    res.status(201).json(suggestion);
  } catch (error) {
    console.error("Error in createSuggestion:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteSuggestion = async (req, res) => {
  try {
    // Counselors resolve any report; students may only withdraw their own.
    const filter = req.user.constructor.modelName === "Counselor"
      ? { _id: req.params.id }
      : { _id: req.params.id, studentId: req.user._id };
    const suggestion = await Suggestion.findOneAndUpdate(filter, { isDeleted: true }, { new: true });
    if (!suggestion) return res.status(404).json({ error: "Suggestion not found" });
    res.json(suggestion);
  } catch (error) {
    if (error.name === "CastError") return res.status(404).json({ error: "Suggestion not found" });
    console.error("Error in deleteSuggestion:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
