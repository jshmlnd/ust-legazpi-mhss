import JournalEntry from "../models/journalEntry.model.js";

const MOOD_SCORE = { great: 9, good: 7, okay: 5, low: 3, bad: 1 };

export const getEntries = async (req, res) => {
  try {
    const entries = await JournalEntry.find({ studentId: req.user._id }).sort({ createdAt: -1 });
    res.json(entries);
  } catch (error) {
    console.error("Error in getEntries:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createEntry = async (req, res) => {
  try {
    const { title, content, mood } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required" });
    }
    const entry = new JournalEntry({ title, content, mood, studentId: req.user._id });
    await entry.save();
    res.status(201).json(entry);
  } catch (error) {
    console.error("Error in createEntry:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};

export const deleteEntry = async (req, res) => {
  try {
    const entry = await JournalEntry.findOneAndDelete({ _id: req.params.id, studentId: req.user._id });
    if (!entry) return res.status(404).json({ error: "Entry not found" });
    res.json({ message: "Entry deleted" });
  } catch (error) {
    console.error("Error in deleteEntry:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMoodAnalytics = async (req, res) => {
  try {
    const entries = await JournalEntry.find({ studentId: req.user._id }).sort({ date: 1 });
    const dailyScores = {};
    entries.forEach((e) => {
      dailyScores[e.date] = MOOD_SCORE[e.mood] || 5;
    });
    res.json({ entries: Object.entries(dailyScores).map(([date, score]) => ({ date, score })) });
  } catch (error) {
    console.error("Error in getMoodAnalytics:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
