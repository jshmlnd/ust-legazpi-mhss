import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import Counselor from "../models/counselor.model.js";
import bcrypt from "bcryptjs";

export const login = async (req , res) => {
    const { studentId, counselorId, password } = req.body;

    try {
        const user = await User.findOne({ studentId, counselorId });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (!isPasswordCorrect) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        generateToken(user._id, res);

        return res.status(200).json({ 
            _id:user._id, 
            fullName: user.fullName, 
            email: user.email, 
            phone: user.phone,
            studentId: user.studentId,
            password: user.password,
            userType: user.userType, 
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
    const { studentId, password, fullName, email, phone, userType } = req.body;

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
                password: newUser.password,
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
                password: newUser.password,
            })
        } else {
            return res.status(400).json({ message: "Invalid user data" });
        }
    } catch (error) {
        console.log("Error in register controller: ", error.message);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export const updateProfile = async (req, res) => {
    const {  }
}