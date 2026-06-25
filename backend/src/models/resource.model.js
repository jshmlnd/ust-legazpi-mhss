import mongoose from 'mongoose';

const resourceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: {
    type: String,
    enum: ['article', 'hotline', 'sheet', 'location'],
    required: true,
  },
  description: { type: String, default: '' },
  url: { type: String, default: '' },
  address: { type: String, default: '' },
  hours: { type: String, default: '' },
  contact: { type: String, default: '' },
  lat: { type: Number },
  lng: { type: Number },
  order: { type: Number, default: 0 },
}, { timestamps: true });

const Resource = mongoose.model('Resource', resourceSchema);
export default Resource;
