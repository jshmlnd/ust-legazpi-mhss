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
            enum: ['User', 'Counselor'] // Restricts values to your two model names
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
        text: {
            type: String,
        },
        image: {
            type: String,
        },
    },
    { timestamps: true }
);

const Message = mongoose.model('Message', messageSchema);

export default Message;