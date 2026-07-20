import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import Counselor from "../models/counselor.model.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";
import { Resend } from "resend";

const getResend = () => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY not configured");
    return new Resend(apiKey);
};

const generateOTP = () => {
    return Math.floor(10000 + Math.random() * 90000).toString();
};

export const sendOTP = async (req, res) => {
    try {
        const userId = req.user._id;
        const Model = req.user.constructor.modelName === "Counselor" ? Counselor : User;
        const account = await Model.findById(userId);
        if (!account) return res.status(404).json({ message: "Account not found" });

        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

        account.otp = otp;
        account.otpExpiry = otpExpiry;
        await account.save();

        const resend = getResend();
        await resend.emails.send({
            from: process.env.RESEND_FROM || "MHSS <onboarding@resend.dev>",
            to: account.email,
            subject: "Your Verification Code",
            text: `Your verification code is: ${otp}. It expires in 10 minutes.`,
        });

        res.status(200).json({ message: "OTP sent successfully" });
    } catch (error) {
        console.log("Error in sendOTP controller: ", error.message);
        return res.status(500).json({ message: "Failed to send OTP" });
    }
};

export const verifyOTP = async (req, res) => {
    try {
        const { otp } = req.body;
        const userId = req.user._id;
        const Model = req.user.constructor.modelName === "Counselor" ? Counselor : User;
        const account = await Model.findById(userId);
        if (!account) return res.status(404).json({ message: "Account not found" });

        if (!account.otp || !account.otpExpiry) {
            return res.status(400).json({ message: "No OTP pending verification" });
        }

        if (new Date() > account.otpExpiry) {
            account.otp = null;
            account.otpExpiry = null;
            await account.save();
            return res.status(400).json({ message: "OTP has expired" });
        }

        if (account.otp !== otp) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        account.otp = null;
        account.otpExpiry = null;
        account.twoFactorEnabled = true;
        await account.save();

        res.status(200).json({ message: "Two-factor authentication enabled" });
    } catch (error) {
        console.log("Error in verifyOTP controller: ", error.message);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const disable2FA = async (req, res) => {
    try {
        const userId = req.user._id;
        const Model = req.user.constructor.modelName === "Counselor" ? Counselor : User;
        const account = await Model.findById(userId);
        if (!account) return res.status(404).json({ message: "Account not found" });

        account.twoFactorEnabled = false;
        account.otp = null;
        account.otpExpiry = null;
        await account.save();

        res.status(200).json({ message: "Two-factor authentication disabled" });
    } catch (error) {
        console.log("Error in disable2FA controller: ", error.message);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const updateProfileDetails = async (req, res) => {
    try {
        const userId = req.user._id;
        const { fullName, email, phone, department, program, yearLevel } = req.body;

        const Model = req.user.constructor.modelName === "Counselor" ? Counselor : User;
        const account = await Model.findById(userId);
        if (!account) return res.status(404).json({ message: "Account not found" });

        if (fullName) account.fullName = fullName;
        if (email) account.email = email;
        if (phone !== undefined && account.phone !== undefined) account.phone = phone;
        if (department && account.department !== undefined) account.department = department;
        if (program && account.program !== undefined) account.program = program;
        if (yearLevel && account.yearLevel !== undefined) account.yearLevel = yearLevel;

        await account.save();

        const updated = await Model.findById(userId).select("-password");
        res.status(200).json(updated);
    } catch (error) {
        console.log("Error in updateProfileDetails controller: ", error.message);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const login = async (req , res) => {
    const { studentId, counselorId, password } = req.body;

    try {
        let account = null;
        let role = "";

        if (studentId) {
            account = await User.findOne({ studentId });
            if (!account && !isNaN(Number(studentId))) {
                account = await User.findById(Number(studentId));
            }
            role = "student";
        } 
        
        if (!account && counselorId) {
            account = await Counselor.findOne({ counselorId });
            if (!account && !isNaN(Number(counselorId))) {
                account = await Counselor.findById(Number(counselorId));
            }
            role = "counselor";
        }

        if (!account) {
            return res.status(404).json({ message: "User not found" });
        }

        const isPasswordCorrect = await bcrypt.compare(password, account.password);

        if (!isPasswordCorrect) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        generateToken(account._id, res);

        return res.status(200).json({ 
            _id: account._id, 
            fullName: account.fullName, 
            email: account.email, 
            phone: account.phone || null,
            studentId: account.studentId,
            department: account.department,
            program: account.program,
            yearLevel: account.yearLevel,
            profilePic: account.profilePic || '',
            userType: account.userType || role, 
         });

    } catch (error) {
        console.log("Error in login controller: ", error.message);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const logout = (req , res) => {
    try {
        res.cookie("jwt", "", {maxAge: 0})
        res.status(200).json({ message: "Logout successful" });
    }catch (error) {
        console.log("error in logout controller: ", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const register = async (req, res) => {
    const { studentId, password, fullName, email, phone, userType, department, program } = req.body;

    try {
        if (password.length < 8) {
            return res.status(400).json({ message: "Password must be at least 8 characters long" });
        }

        const user = await User.findOne({ studentId })

        if (user) return res.status(400).json({ message: "User already exists" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            studentId,
            password: hashedPassword,
            fullName,
            email,
            phone,
            userType,
            department,
            program,
        });

        if (newUser) {
            generateToken(newUser._id, res);
            await newUser.save();

            res.status(201).json({
                _id:newUser._id,
                fullName: newUser.fullName,
                email: newUser.email,
                phone: newUser.phone,
                studentId: newUser.studentId,
                department: newUser.department,
                program: newUser.program,
                yearLevel: newUser.yearLevel,
                profilePic: newUser.profilePic || '',
                userType: newUser.userType,
            })
        } else {
            return res.status(400).json({ message: "Invalid user data" });
        }
    } catch (error) {
        console.log("Error in register controller: ", error.message);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const registerCounselor = async (req, res) => {
    const { counselorId, password, fullName, email } = req.body;

    try {
        if (password.length < 8) {
            return res.status(400).json({ message: "Password must be at least 8 characters long" });
        }

        const user = await Counselor.findOne({ counselorId });

        if (user) return res.status(400).json({ message: "User already exists" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new Counselor({
            counselorId,
            password: hashedPassword,
            fullName,
            email,
        });

        if (newUser) {
            generateToken(newUser._id, res);
            await newUser.save();

            res.status(201).json({
                _id:newUser._id,
                fullName: newUser.fullName,
                email: newUser.email,
                counselorId: newUser.counselorId,
            })
        } else {
            return res.status(400).json({ message: "Invalid user data" });
        }
    } catch (error) {
        console.log("Error in register controller: ", error.message);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export const updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user._id;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: "Current and new password are required" });
        }
        if (newPassword.length < 8) {
            return res.status(400).json({ message: "New password must be at least 8 characters" });
        }

        let account = await User.findById(userId);
        if (!account) account = await Counselor.findById(userId);
        if (!account) {
            return res.status(404).json({ message: "Account not found" });
        }

        const isMatch = await bcrypt.compare(currentPassword, account.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Current password is incorrect" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        account.password = hashedPassword;
        await account.save();

        res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
        console.log("Error in updatePassword controller: ", error.message, error.stack);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export const updateProfile = async (req, res) => {
    try {
        const { profilePic } = req.body;
        const userId = req.user._id;

        if(!profilePic) {
            return res.status(400).json({ message: "Profile picture is required" });
        }

        const uploadResponse = await cloudinary.uploader.upload(profilePic)

        const Model = req.user.constructor.modelName === "Counselor" ? Counselor : User;
        const updatedUser = await Model.findByIdAndUpdate(userId, { profilePic: uploadResponse.secure_url }, { new: true }).select("-password");

        res.status(200).json(updatedUser);

    } catch (error) {
        console.log("Error in updateProfile controller: ", error.message);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export const checkAuth = (req, res) => {
    try {
        res.status(200).json(req.user);
    } catch (error) {
        console.log("Error in checkAuth controller: ", error.message);
        return res.status(500).json({ message: "Internal server error" });
    }
}