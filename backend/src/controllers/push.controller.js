import PushSubscription from "../models/pushSubscription.model.js";

// Public VAPID key the frontend needs before calling pushManager.subscribe().
export const getVapidPublicKey = (req, res) => {
    const key = process.env.VAPID_PUBLIC_KEY;
    if (!key) return res.status(503).json({ message: "Push not configured" });
    res.json({ publicKey: key });
};

export const saveSubscription = async (req, res) => {
    try {
        const { endpoint, keys } = req.body || {};
        if (!endpoint || !keys?.p256dh || !keys?.auth) {
            return res.status(400).json({ message: "Invalid subscription" });
        }
        const role = req.user.constructor.modelName === "Counselor" ? "counselor" : "student";
        await PushSubscription.findOneAndUpdate(
            { endpoint },
            { userId: req.user._id, role, endpoint, keys },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        res.status(201).json({ message: "Subscribed" });
    } catch (error) {
        console.error("Error in saveSubscription:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const deleteSubscription = async (req, res) => {
    try {
        const { endpoint } = req.body || {};
        if (endpoint) await PushSubscription.deleteOne({ endpoint });
        res.json({ message: "Unsubscribed" });
    } catch (error) {
        console.error("Error in deleteSubscription:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};
