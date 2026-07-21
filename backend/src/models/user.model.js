import mongoose from "mongoose";
import { generateUniqueId } from "../lib/generateId.js";

const userSchema = new mongoose.Schema(
    {
        _id: {
            type: Number,
        },
        studentId: {
            type: String,
            required: true,
            minlength: 7,
            maxlength: 7,
        },
        password: {
            type: String,
            required: true,
            minlength: 8,
        },
        fullName: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        phone: {
            type: String,
            required: true,
        },
        profilePic: {
            type: String,
            default: '',
        },
        userType: {
            type: String,
            default: 'Student',
        },
        department: {
            type: String,
            required: [true, 'Department is required'],
            enum: { values: ['CEAFA', 'CHS', 'CASE', 'CBMA'], message: `{VALUE} is not a valid department` },
        },
        program: {
            type: String,
            required: [true, 'Program is required'],
        },
        yearLevel: {
            type: Number,
            default: 1,
        },
        mother: {
            name: { type: String, default: '' },
            occupation: { type: String, default: '' },
            contact: { type: String, default: '' },
        },
        father: {
            name: { type: String, default: '' },
            occupation: { type: String, default: '' },
            contact: { type: String, default: '' },
        },
        guardian: {
            name: { type: String, default: '' },
            relationship: { type: String, default: '' },
            contact: { type: String, default: '' },
        },
        emergencyContact: {
            name: { type: String, default: '' },
            relationship: { type: String, default: '' },
            contact: { type: String, default: '' },
            address: { type: String, default: '' },
        },

    },
    { timestamps: true, _id: false });

userSchema.pre("save", async function () {
  if (!this._id) {
    this._id = await generateUniqueId(mongoose.model("User"));
  }
});

const User = mongoose.model("User", userSchema);

export default User;