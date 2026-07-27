import Notice from "../models/notice.model.js";

export const getNotice = async (req, res) => {
  try {
    let notice = await Notice.findOne();
    if (!notice) {
      notice = await Notice.create({
        tag: "NOTICE",
        text: "Counseling services are available for walk-in appointments every Monday and Thursday, 8:00 AM – 4:00 PM at the Office of Guidance and Testing.",
        linkHref: "/university-updates",
        linkLabel: "Read latest updates",
      });
    }
    res.json(notice);
  } catch (error) {
    console.error("Error in getNotice:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateNotice = async (req, res) => {
  try {
    const { tag, text, linkHref, linkLabel } = req.body;
    let notice = await Notice.findOne();
    if (!notice) {
      notice = await Notice.create({ tag, text, linkHref, linkLabel });
    } else {
      if (tag !== undefined) notice.tag = tag;
      if (text !== undefined) notice.text = text;
      if (linkHref !== undefined) notice.linkHref = linkHref;
      if (linkLabel !== undefined) notice.linkLabel = linkLabel;
      await notice.save();
    }
    res.json(notice);
  } catch (error) {
    console.error("Error in updateNotice:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
