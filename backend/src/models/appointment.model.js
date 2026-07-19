import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  studentId: { type: Number, required: true, ref: 'User' },
  counselorId: { type: Number, required: true, ref: 'Counselor' },
  type: { type: String, enum: ['Chat', 'chat', 'Face-To-Face', 'Review'], required: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'active', 'completed', 'cancelled', 'declined', 'archived'],
    default: 'pending',
  },
  date: { type: String, required: true },
  time: { type: String, required: true },
  duration: { type: String, default: '45 min' },
  concern: { type: String, default: '' },
  notes: { type: String, default: '' },
  startedAt: { type: Date },
  endedAt: { type: Date },
}, { timestamps: true });

const Appointment = mongoose.model('Appointment', appointmentSchema);
export default Appointment;
