import Suggestion from "../models/suggestion.model.js";

export const getSuggestions = async (req, res) => {
  try {
    const filter = req.user.constructor.modelName === "Counselor"
      ? { isDeleted: { $ne: true } }
      : { studentId: req.user._id, isDeleted: { $ne: true } };
    const suggestions = await Suggestion.find(filter).sort({ createdAt: -1 });
    res.json(suggestions);
  } catch (error) {
    console.error("Error in getSuggestions:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createSuggestion = async (req, res) => {
  try {
    const suggestion = new Suggestion({
      studentId: req.user._id,
      message: req.body.message,
    });
    await suggestion.save();
    res.status(201).json(suggestion);
  } catch (error) {
    console.error("Error in createSuggestion:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteSuggestion = async (req, res) => {
  try {
    const suggestion = await Suggestion.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    );
    if (!suggestion) return res.status(404).json({ error: "Suggestion not found" });
    res.json(suggestion);
  } catch (error) {
    console.error("Error in deleteSuggestion:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
