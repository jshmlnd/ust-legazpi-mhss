import mongoose from "mongoose";

const noticeSchema = new mongoose.Schema(
  {
    tag: {
      type: String,
      default: "NOTICE",
    },
    text: {
      type: String,
      default: "",
    },
    linkHref: {
      type: String,
      default: "/university-updates",
    },
    linkLabel: {
      type: String,
      default: "Read latest updates",
    },
  },
  { timestamps: true }
);

const Notice = mongoose.model("Notice", noticeSchema);

export default Notice;
