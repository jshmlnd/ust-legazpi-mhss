import AvailabilitySlot from "../models/availabilitySlot.model.js";

export const getSlots = async (req, res) => {
  try {
    const { counselorId } = req.params;
    const { date } = req.query;
    const filter = { counselorId: Number(counselorId) };
    if (date) filter.date = date;
    const slots = await AvailabilitySlot.find(filter).sort({ date: 1, time: 1 });
    res.json(slots);
  } catch (error) {
    console.error("Error in getSlots:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const setSlots = async (req, res) => {
  try {
    const { slots } = req.body;
    const dates = [...new Set(slots.map((s) => s.date || ""))];
    await AvailabilitySlot.deleteMany({
      counselorId: req.user._id,
      date: { $in: dates },
    });
    const docs = slots.map((s) => ({
      counselorId: req.user._id,
      date: s.date,
      time: s.time,
      isAvailable: s.isAvailable !== false,
    }));
    const created = await AvailabilitySlot.insertMany(docs);
    res.status(201).json(created);
  } catch (error) {
    console.error("Error in setSlots:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const toggleSlot = async (req, res) => {
  try {
    const slot = await AvailabilitySlot.findById(req.params.id);
    if (!slot) return res.status(404).json({ error: "Slot not found" });
    slot.isAvailable = !slot.isAvailable;
    await slot.save();
    res.json(slot);
  } catch (error) {
    console.error("Error in toggleSlot:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
