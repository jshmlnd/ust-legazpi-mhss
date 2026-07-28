import mongoose from 'mongoose';

const callLogSchema = new mongoose.Schema(
    {
        callerId: {
            type: Number,
            required: true,
        },
        callerModel: {
            type: String,
            required: true,
            enum: ['User', 'Counselor'],
        },
        receiverId: {
            type: Number,
            required: true,
        },
        receiverModel: {
            type: String,
            required: true,
            enum: ['User', 'Counselor'],
        },
        duration: {
            type: Number,
            default: 0,
        },
        status: {
            type: String,
            enum: ['ended', 'cancelled', 'missed'],
            default: 'ended',
        },
    },
    { timestamps: true }
);

const CallLog = mongoose.model('CallLog', callLogSchema);

export default CallLog;
