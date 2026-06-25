import mongoose from 'mongoose';

const availabilitySlotSchema = new mongoose.Schema({
  counselorId: { type: Number, required: true, ref: 'Counselor' },
  date: { type: String, default: '' },
  time: { type: String, required: true },
  isAvailable: { type: Boolean, default: true },
}, { timestamps: true });

availabilitySlotSchema.index({ counselorId: 1, date: 1 });

const AvailabilitySlot = mongoose.model('AvailabilitySlot', availabilitySlotSchema);
export default AvailabilitySlot;
