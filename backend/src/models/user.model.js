import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        studentId: {
            type: String,
            required: true,
            minlength: 7,
            maxlenth:7,
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
        }
    },
    { timestamps: true });

const User = mongoose.model("User", userSchema);

export default User;