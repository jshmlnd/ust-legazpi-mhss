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
        appointmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Appointment',
            default: null,
        },
        type: {
            type: String,
            enum: ['text', 'image', 'file', 'video'],
            default: 'text',
        },
        text: {
            type: String,
        },
        image: {
            type: String,
        },
        fileUrl: {
            type: String,
        },
        fileName: {
            type: String,
        },
        fileSize: {
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