import mongoose from 'mongoose';

const suggestionSchema = new mongoose.Schema({
  studentId: { type: Number, required: true, ref: 'User' },
  message: { type: String, required: true },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

const Suggestion = mongoose.model('Suggestion', suggestionSchema);
export default Suggestion;
