import mongoose from 'mongoose';

const resourceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: {
    type: String,
    // 'article' and 'sheet' are legacy documents created before the
    // psychiatrist/psychologist types existed; keep them valid so old docs
    // can still be read and edited.
    enum: [ 'hotline', 'location', 'psychiatrist', 'psychologist'],
    required: true,
  },
  description: { type: String, default: '' },
  url: { type: String, default: '' },
  address: { type: String, default: '' },
  hours: { type: String, default: '' },
  contact: { type: String, default: '' },
  lat: { type: Number },
  lng: { type: Number },
  mapUrl: { type: String, default: '' },
  order: { type: Number, default: 0 },
}, { timestamps: true });

const Resource = mongoose.model('Resource', resourceSchema);
export default Resource;
