import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
    {
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            refPath: 'senderModel' // Tells Mongoose to look at the 'senderModel' field
        },
        senderModel: {
            type: String,
            required: true,
            enum: ['User', 'Counselor'] // Restricts values to your two model names
        },
        receiverId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            refPath: 'receiverModel' // Tells Mongoose to look at the 'receiverModel' field
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