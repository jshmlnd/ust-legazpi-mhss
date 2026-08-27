import { analyzeCrisis } from "../lib/crisisDetector.js";

export const analyze = async (req, res) => {
  try {
    const { text } = req.body;
    const result = analyzeCrisis(text || '');
    res.json(result);
  } catch (error) {
    console.error("Error in crisis analyze:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
