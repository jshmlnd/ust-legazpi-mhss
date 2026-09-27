import mongoose from "mongoose";

// Web Push subscriptions (Web Push protocol / VAPID). One user may have
// several (multiple devices/browsers); stale endpoints are pruned on 404/410.
const pushSubscriptionSchema = new mongoose.Schema({
    userId: { type: Number, required: true },
    role: { type: String, enum: ["student", "counselor"], required: true },
    endpoint: { type: String, required: true },
    keys: {
        p256dh: { type: String, required: true },
        auth: { type: String, required: true },
    },
}, { timestamps: true });

pushSubscriptionSchema.index({ userId: 1 });
pushSubscriptionSchema.index({ endpoint: 1 }, { unique: true });

const PushSubscription = mongoose.model("PushSubscription", pushSubscriptionSchema);
export default PushSubscription;
