export const reorder = async (Model, label, req, res) => {
  try {
    const { orderedIds } = req.body;
    for (let i = 0; i < orderedIds.length; i++) {
      await Model.findByIdAndUpdate(orderedIds[i], { order: i });
    }
    res.json(await Model.find().sort({ order: 1 }));
  } catch (error) {
    console.error(`Error in reorder${label}s:`, error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
