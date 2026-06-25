import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  studentId: { type: Number, required: true, ref: 'User' },
  counselorId: { type: Number, required: true, ref: 'Counselor' },
  type: { type: String, enum: ['chat', 'f2f', 'review'], required: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'active', 'completed', 'cancelled', 'declined'],
    default: 'pending',
  },
  date: { type: String, required: true },
  time: { type: String, required: true },
  duration: { type: String, default: '45 min' },
  concern: { type: String, default: '' },
  notes: { type: String, default: '' },
}, { timestamps: true });

const Appointment = mongoose.model('Appointment', appointmentSchema);
export default Appointment;
