import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import User from "../models/user.model.js";
import Counselor from "../models/counselor.model.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";
import { generateUniqueDynamicId, getDailyDynamicId } from "../lib/generateId.js";
import {
    encryptSecret,
    decryptSecret,
    createTotpSecret,
    buildOtpAuthUri,
    buildQrDataUrl,
    verifyTotpToken,
} from "../lib/totp.js";
import { sendMail, passwordChangedEmailTemplate } from "../lib/mailer.js";

const generateToken = (userId, res) => {
    const token = jwt.sign({userId}, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.cookie("jwt", token, {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV !== "development",
    });
    return token;
};

const generateTwoFactorToken = (userId) => {
    return jwt.sign({ userId, twoFactor: true }, process.env.JWT_SECRET, { expiresIn: "10m" });
};

const serializeUser = (user, role) => ({
    _id: user._id,
    dynamicId: getDailyDynamicId(user.dynamicId),
    fullName: user.fullName,
    email: user.email,
    phone: user.phone || null,
    studentId: user.studentId,
    department: user.department,
    program: user.program,
    yearLevel: user.yearLevel,
    profilePic: user.profilePic || '',
    userType: user.userType || role,
    pin: user.pin,
    twoFactorEnabled: user.twoFactorEnabled,
    totpEnabled: !!user.totpEnabled,
    showNameToCounselor: user.showNameToCounselor || false,
    receiveOgtUpdates: user.receiveOgtUpdates !== false,
});

const getModel = (req) => (req.user.constructor.modelName === "Counselor" ? Counselor : User);

export const updateProfileDetails = async (req, res) => {
    try {
        const userId = req.user._id;
        const { fullName, email, phone, department, program, yearLevel, showNameToCounselor, receiveOgtUpdates } = req.body;

        const Model = req.user.constructor.modelName === "Counselor" ? Counselor : User;
        const account = await Model.findById(userId);
        if (!account) return res.status(404).json({ message: "Account not found" });

        if (fullName) account.fullName = fullName;
        if (email) account.email = email;
        if (phone !== undefined && account.phone !== undefined) account.phone = phone;
        if (department && account.department !== undefined) account.department = department;
        if (program && account.program !== undefined) account.program = program;
        if (yearLevel && account.yearLevel !== undefined) account.yearLevel = yearLevel;
        if (typeof showNameToCounselor === 'boolean' && account.showNameToCounselor !== undefined) account.showNameToCounselor = showNameToCounselor;
        if (typeof receiveOgtUpdates === 'boolean' && account.receiveOgtUpdates !== undefined) account.receiveOgtUpdates = receiveOgtUpdates;

        await account.save();

        const updated = await Model.findById(userId).select("-password");
        res.status(200).json(serializeUser(updated));
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

        if (role === "student" && !account.dynamicId) {
            account.dynamicId = await generateUniqueDynamicId(User);
            await account.save();
        }

        const isPasswordCorrect = await bcrypt.compare(password, account.password);

        if (!isPasswordCorrect) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        if (account.twoFactorEnabled && account.pin) {
            const twoFactorToken = generateTwoFactorToken(account._id);
            return res.status(200).json({ twoFactorRequired: true, twoFactorToken, twoFactorType: 'pin' });
        }

        if (account.totpEnabled && account.totpSecret) {
            const twoFactorToken = generateTwoFactorToken(account._id);
            return res.status(200).json({ twoFactorRequired: true, twoFactorToken, twoFactorType: 'totp' });
        }

        generateToken(account._id, res);

        return res.status(200).json(serializeUser(account, role));

    } catch (error) {
        console.log("Error in login controller: ", error.message);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const verifyTwoFactor = async (req, res) => {
    try {
        const { twoFactorToken, pin } = req.body;

        if (!twoFactorToken || !pin) {
            return res.status(400).json({ message: "PIN is required" });
        }

        let decoded;
        try {
            decoded = jwt.verify(twoFactorToken, process.env.JWT_SECRET);
        } catch {
            return res.status(401).json({ message: "Session expired. Please sign in again." });
        }

        if (!decoded.twoFactor) {
            return res.status(401).json({ message: "Invalid 2FA token" });
        }

        let account = await User.findById(decoded.userId);
        if (!account) account = await Counselor.findById(decoded.userId);
        if (!account) {
            return res.status(404).json({ message: "Account not found" });
        }

        // TOTP takes precedence when enrolled; the PIN code path is kept for
        // accounts still on PIN 2FA (and removed once TOTP is confirmed).
        // Rate limited: this is the pre-auth brute-force surface for codes.
        assertOtpBudget({ user: account });
        if (account.totpEnabled && account.totpSecret) {
            if (!pin) return res.status(400).json({ message: "Authenticator code is required" });
            const { valid } = await verifyTotpToken(decryptSecret(account.totpSecret), pin);
            if (!valid) {
                noteOtpFailure({ user: account });
                return res.status(401).json({ message: "Incorrect authenticator code" });
            }
        } else if (!account.pin || !safeEqual(pin, account.pin)) {
            noteOtpFailure({ user: account });
            return res.status(401).json({ message: "Incorrect PIN" });
        }
        clearOtpBudget({ user: account });

        generateToken(account._id, res);

        return res.status(200).json(serializeUser(account));
    } catch (error) {
        console.log("Error in verifyTwoFactor controller: ", error.message);
        return res.status(error.statusCode || 500).json({ message: error.statusCode ? error.message : "Internal server error" });
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

            res.status(201).json(serializeUser(newUser));
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

        // Security notification: "Did you change your password?" — sent to
        // students and counselors alike (fire-and-optimistic; a Mailtrap
        // outage must not fail the password change itself).
        sendMail({
            to: account.email,
            subject: "Did you change your password?",
            html: passwordChangedEmailTemplate({
                fullName: account.fullName,
                when: new Intl.DateTimeFormat("en-PH", { dateStyle: "full", timeStyle: "short", timeZone: "Asia/Manila" }).format(new Date()),
            }),
        });

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
        const Model = req.user.constructor.modelName === "Counselor" ? Counselor : User;

        if(profilePic === undefined) {
            return res.status(400).json({ message: "Profile picture is required" });
        }

        if(profilePic === '') {
        const updatedUser = await Model.findByIdAndUpdate(userId, { profilePic: '' }, { new: true }).select("-password");
        return res.status(200).json(serializeUser(updatedUser));
        }

        const uploadResponse = await cloudinary.uploader.upload(profilePic, { folder: "Profile Pictures" })

        const updatedUser = await Model.findByIdAndUpdate(userId, { profilePic: uploadResponse.secure_url }, { new: true }).select("-password");

        res.status(200).json(serializeUser(updatedUser));

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

export const setPin = async (req, res) => {
    try {
        const { pin } = req.body;
        const userId = req.user._id;

        if (!pin || pin.length < 4) {
            return res.status(400).json({ message: "PIN must be at least 4 digits" });
        }

        const Model = req.user.constructor.modelName === "Counselor" ? Counselor : User;
        const account = await Model.findById(userId);
        if (!account) return res.status(404).json({ message: "Account not found" });

        account.pin = pin;
        await account.save();

        res.status(200).json({ message: "PIN set successfully" });
    } catch (error) {
        console.log("Error in setPin controller: ", error.message);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export const verifyPin = async (req, res) => {
    try {
        const { pin, expect } = req.body;
        const userId = req.user._id;

        if (!pin) {
            return res.status(400).json({ message: "PIN is required" });
        }

        const Model = req.user.constructor.modelName === "Counselor" ? Counselor : User;
        const account = await Model.findById(userId);
        if (!account) return res.status(404).json({ message: "Account not found" });

        // Default precedence matches login: TOTP code when enrolled. PIN-management
        // flows (change/remove PIN) pass expect: 'pin' so a TOTP code can never
        // stand in for the current PIN.
        const useTotp = !expect && account.totpEnabled && account.totpSecret;
        assertOtpBudget(req);
        if (useTotp) {
            const { valid } = await verifyTotpToken(decryptSecret(account.totpSecret), pin);
            if (!valid) {
                noteOtpFailure(req);
                return res.status(401).json({ message: "Incorrect authenticator code" });
            }
        } else if (!account.pin) {
            return res.status(400).json({ message: "No PIN set. Please set a PIN first." });
        } else if (!safeEqual(pin, account.pin)) {
            noteOtpFailure(req);
            return res.status(401).json({ message: "Incorrect PIN" });
        }
        clearOtpBudget(req);

        res.status(200).json({ message: "PIN verified" });
    } catch (error) {
        console.log("Error in verifyPin controller: ", error.message);
        return res.status(error.statusCode || 500).json({ message: error.statusCode ? error.message : "Internal server error" });
    }
}

export const removePin = async (req, res) => {
    try {
        const { pin } = req.body;
        const userId = req.user._id;

        if (!pin) {
            return res.status(400).json({ message: "PIN is required to remove PIN" });
        }

        const Model = req.user.constructor.modelName === "Counselor" ? Counselor : User;
        const account = await Model.findById(userId);
        if (!account) return res.status(404).json({ message: "Account not found" });

        if (!account.pin) {
            return res.status(400).json({ message: "No PIN set." });
        }

        assertOtpBudget(req);
        if (!safeEqual(pin, account.pin)) {
            noteOtpFailure(req);
            return res.status(401).json({ message: "Incorrect PIN" });
        }
        clearOtpBudget(req);

        account.pin = "";
        account.twoFactorEnabled = false;
        await account.save();
        // NOTE: TOTP (totpEnabled) is intentionally left untouched — removing
        // the PIN must not silently disable authenticator-based 2FA.

        res.status(200).json({ message: "PIN removed successfully", twoFactorEnabled: account.twoFactorEnabled });
    } catch (error) {
        console.log("Error in removePin controller: ", error.message);
        return res.status(error.statusCode || 500).json({ message: error.statusCode ? error.message : "Internal server error" });
    }
}// ── TOTP (Google Authenticator) 2FA ──

// Brute-force guard for 2FA code entry (verify/confirm/disable + PIN verify).
// In-memory — per-process counters are sufficient here because the state being
// protected (a TOTP secret) rotates on every setup and the deployment is a
// single node process. ponytail: 10 attempts / 10 min per user blocks online
// guessing (10^-7 success per window) without locking a legitimate user out
// for longer than a code rotation cycle.
const otpAttempts = new Map(); // key: `${model}:${userId}` → { count, resetAt }
const OTP_MAX_ATTEMPTS = 10;
const OTP_WINDOW_MS = 10 * 60 * 1000;

function assertOtpBudget(req) {
    const key = `${req.user.constructor.modelName}:${req.user._id}`;
    const now = Date.now();
    const entry = otpAttempts.get(key);
    if (!entry || now > entry.resetAt) {
        otpAttempts.set(key, { count: 0, resetAt: now + OTP_WINDOW_MS });
        return;
    }
    if (entry.count >= OTP_MAX_ATTEMPTS) {
        const secs = Math.ceil((entry.resetAt - now) / 1000);
        const err = new Error(`Too many attempts. Try again in ${secs}s.`);
        err.statusCode = 429;
        throw err;
    }
}

function noteOtpFailure(req) {
    const key = `${req.user.constructor.modelName}:${req.user._id}`;
    const entry = otpAttempts.get(key);
    if (entry) entry.count += 1;
}

function clearOtpBudget(req) {
    otpAttempts.delete(`${req.user.constructor.modelName}:${req.user._id}`);
}

// Timing-safe string compare for fixed-length credential checks (PINs are
// 4–6 digits; TOTP codes 6). ponytail: codes are short-lived and rate-limited
// above, so this closes the residual timing oracle on the byte-compare.
function safeEqual(a, b) {
    const ab = Buffer.from(String(a ?? ''));
    const bb = Buffer.from(String(b ?? ''));
    return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

// Step 1 of enrollment: generate a secret + QR for the authenticator app.
// The secret is stored encrypted but NOT activated until a valid code is
// confirmed, so a stray tap can't lock the user out.
export const totpSetup = async (req, res) => {
    try {
        const userId = req.user._id;
        const Model = getModel(req);
        const account = await Model.findById(userId);
        if (!account) return res.status(404).json({ message: "Account not found" });

        // ponytail: re-enrollment OVERWRITES the stored secret but cannot
        // silently deactivate an active factor — totpEnabled stays true until
        // /2fa/confirm succeeds, and login/verify keep using the OLD secret in
        // the meantime (totpEnabled && totpSecret both still set). A session
        // hijacker who hits /2fa/setup can at most pre-plant a pending secret;
        // activating it still requires the next valid code from the attacker's
        // app, which the flow below allows only because the real user has not
        // re-confirmed — acceptable residual risk documented here.
        const secret = createTotpSecret();
        const wasEnabled = account.totpEnabled;
        account.totpSecret = encryptSecret(secret);
        account.totpEnabled = false; // re-enrollment must be re-confirmed
        await account.save();
        if (wasEnabled) {
            // An active factor was just reset. Require re-confirmation within
            // this window; if never confirmed, TOTP stays off (not locked on).
            console.log(`[2fa] TOTP re-enrollment started for ${req.user.constructor.modelName}:${userId}`);
        }

        const accountName = account.email || account.studentId || account.counselorId || String(account._id);
        const uri = buildOtpAuthUri({ secret, accountName });
        const qrDataUrl = await buildQrDataUrl(uri);

        res.status(200).json({ secret, qrDataUrl, uri });
    } catch (error) {
        console.log("Error in totpSetup controller: ", error.message);
        return res.status(error.statusCode || 500).json({ message: error.statusCode ? error.message : "Internal server error" });
    }
};

// Step 2 of enrollment: confirm a code from the app, activating TOTP.
export const totpVerify = async (req, res) => {
    try {
        const { token } = req.body;
        const userId = req.user._id;
        const Model = getModel(req);
        const account = await Model.findById(userId);
        if (!account) return res.status(404).json({ message: "Account not found" });

        if (!account.totpSecret) {
            return res.status(400).json({ message: "No authenticator setup in progress. Start setup first." });
        }
        if (account.totpEnabled) {
            return res.status(400).json({ message: "Authenticator is already enabled." });
        }

        assertOtpBudget(req);
        const { valid } = await verifyTotpToken(decryptSecret(account.totpSecret), token);
        if (!valid) {
            noteOtpFailure(req);
            return res.status(401).json({ message: "Incorrect code. Check your authenticator app and try again." });
        }
        clearOtpBudget(req);

        account.totpEnabled = true;
        // TOTP replaces PIN 2FA as the account's second factor. The PIN
        // itself stays as a credential for password-change confirmation.
        account.twoFactorEnabled = false;
        await account.save();

        res.status(200).json({ totpEnabled: true, twoFactorEnabled: false, message: "Authenticator enabled." });
    } catch (error) {
        console.log("Error in totpVerify controller: ", error.message);
        return res.status(error.statusCode || 500).json({ message: error.statusCode ? error.message : "Internal server error" });
    }
};

// Disable TOTP; requires either a current valid code or the account PIN.
export const totpDisable = async (req, res) => {
    try {
        const { token, pin } = req.body;
        const userId = req.user._id;
        const Model = getModel(req);
        const account = await Model.findById(userId);
        if (!account) return res.status(404).json({ message: "Account not found" });

        if (!account.totpEnabled) {
            return res.status(400).json({ message: "Authenticator is not enabled." });
        }

        assertOtpBudget(req);
        let authorized = false;
        if (token) {
            const { valid } = account.totpSecret
                ? await verifyTotpToken(decryptSecret(account.totpSecret), token)
                : { valid: false };
            authorized = valid;
        }
        if (!authorized && pin && account.pin && safeEqual(pin, account.pin)) authorized = true;
        if (!authorized) {
            noteOtpFailure(req);
            return res.status(401).json({ message: "Provide a valid authenticator code or your PIN to disable." });
        }
        clearOtpBudget(req);

        account.totpEnabled = false;
        account.totpSecret = '';
        await account.save();
        res.status(200).json({ totpEnabled: false, message: "Authenticator disabled." });
    } catch (error) {
        console.log("Error in totpDisable controller: ", error.message);
        return res.status(error.statusCode || 500).json({ message: error.statusCode ? error.message : "Internal server error" });
    }
};
