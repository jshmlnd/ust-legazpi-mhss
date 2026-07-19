import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
    {
        senderId: {
            type: Number,
            required: true,
            refPath: 'senderModel'
        },
        senderModel: {
            type: String,
            required: true,
            enum: ['User', 'Counselor']
        },
        receiverId: {
            type: Number,
            required: true,
            refPath: 'receiverModel'
        },
        receiverModel: {
            type: String,
            required: true,
            enum: ['User', 'Counselor']
        },
        type: {
            type: String,
            enum: ['text', 'image', 'call-log'],
            default: 'text',
        },
        text: {
            type: String,
        },
        image: {
            type: String,
        },
        callDuration: {
            type: Number,
            default: 0,
        },
        read: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

const Message = mongoose.model('Message', messageSchema);

export default Message;