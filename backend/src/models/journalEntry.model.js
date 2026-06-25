import mongoose from 'mongoose';

const journalEntrySchema = new mongoose.Schema({
  studentId: { type: Number, required: true, ref: 'User' },
  title: { type: String, required: true },
  content: { type: String, required: true },
  mood: {
    type: String,
    enum: ['great', 'good', 'okay', 'low', 'bad'],
    default: 'okay',
  },
  date: { type: String },
}, { timestamps: true });

journalEntrySchema.pre('save', function () {
  if (!this.date) {
    this.date = new Date().toLocaleDateString('en-US', {
      month: '2-digit', day: '2-digit', year: 'numeric',
    }).replace(/\//g, '-');
  }
});

const JournalEntry = mongoose.model('JournalEntry', journalEntrySchema);
export default JournalEntry;
