import mongoose from "mongoose";

const counselorSchema = new mongoose.Schema(
    {
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
            required: false,
            unique: true,
        },
        profilePic: {
            type: String,
            default: "",
        },
        userType: {
            type: String,
            default: "Counselor",
        }
    },
    { timestamps: true });

const Counselor = mongoose.model("Counselor", counselorSchema);

export default Counselor;