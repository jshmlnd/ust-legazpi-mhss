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
    const { text } = req.body;
    let notice = await Notice.findOne();
    if (!notice) {
      notice = await Notice.create({ tag: 'NOTICE', text, linkHref: '/university-updates', linkLabel: 'Read latest updates' });
    } else {
      if (text !== undefined) notice.text = text;
      notice.tag = 'NOTICE';
      notice.linkHref = '/university-updates';
      notice.linkLabel = 'Read latest updates';
      await notice.save();
    }
    res.json(notice);
  } catch (error) {
    console.error("Error in updateNotice:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
