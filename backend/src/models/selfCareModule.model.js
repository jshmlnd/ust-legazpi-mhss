import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  label: { type: String, required: true },
  link: { type: String, default: '' },
  completed: { type: Boolean, default: false },
}, { _id: true });

const selfCareModuleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  icon: { type: String, default: 'Sparkles' },
  activities: [activitySchema],
  order: { type: Number, default: 0 },
  createdBy: { type: Number, ref: 'Counselor' },
}, { timestamps: true });

const SelfCareModule = mongoose.model('SelfCareModule', selfCareModuleSchema);
export default SelfCareModule;
