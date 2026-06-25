import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  body: { type: String, required: true },
  author: { type: String, default: 'Counseling Office' },
  views: { type: Number, default: 0 },
  clicks: { type: Number, default: 0 },
  reactions: { type: Object, default: {} },
}, { timestamps: true });

const Announcement = mongoose.model('Announcement', announcementSchema);
export default Announcement;
