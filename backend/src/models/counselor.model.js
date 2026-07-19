import mongoose from "mongoose";
import { generateUniqueId } from "../lib/generateId.js";

const counselorSchema = new mongoose.Schema(
    {
        _id: {
            type: Number,
        },
        counselorId: {
            type: String,
            required: true,
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
            default: "",
        },
        profilePic: {
            type: String,
            default: "",
        },
        userType: {
            type: String,
            default: "Counselor",
        },
        twoFactorEnabled: {
            type: Boolean,
            default: false,
        },
        otp: {
            type: String,
            default: null,
        },
        otpExpiry: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true, _id: false });

counselorSchema.pre("save", async function () {
  if (!this._id) {
    this._id = await generateUniqueId(mongoose.model("Counselor"));
  }
});

const Counselor = mongoose.model("Counselor", counselorSchema);

export default Counselor;