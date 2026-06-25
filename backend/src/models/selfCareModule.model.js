import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  label: { type: String, required: true },
  completed: { type: Boolean, default: false },
}, { _id: true });

const selfCareModuleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  activities: [activitySchema],
  order: { type: Number, default: 0 },
  createdBy: { type: Number, ref: 'Counselor' },
}, { timestamps: true });

const SelfCareModule = mongoose.model('SelfCareModule', selfCareModuleSchema);
export default SelfCareModule;
