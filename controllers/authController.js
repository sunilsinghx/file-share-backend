const Verification = require('../models/verificationModel');
const mailer =require("../utils/mailer.js")
const bcrypt = require('bcrypt');
const responseFunction =require("../utils/responseFunction.js")
const User= require("../models/userModel.js")
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();



async function sendOTP(req, res){
    const { email } = req.body;
    if (!email) {
        return responseFunction(res, 400, 'Email is required', null, false);
    }

    try {
        //if opt already present in db first delete it and create new opt
        await Verification.deleteOne({ email: email });

        //opt
        const code = Math.floor(100000 + Math.random() * 900000);
        
        await mailer(email, code);
        // await Verification.findOneAndDelete({ email: email });
        const newVerification = new Verification({
            email: email,
            code: code,
        })
        await newVerification.save();
        return responseFunction(res, 200, 'OTP sent successfully', null, true);
    }
    catch (err) {
        console.log(err);
        return responseFunction(res, 500, 'Internal server error', null, false);
    }
}

async function registerUser(req, res, next) {
    // console.log(req.file)

    try {
        const { name, email, password, otp, profilePic } = req.body;
        let user = await User.findOne({ email: email });
        
        let verificationQueue = await Verification.findOne({ email: email });
        if (user) {
            return responseFunction(res, 400, 'User already exists', null, false);
        }
        
        //user has not genereted opt yet
        if (!verificationQueue) {

            return responseFunction(res, 400, 'Please send otp first', null, false);
        }

        //match opt with db value
        const isMatch = await bcrypt.compare(otp, verificationQueue.code);
        if (!isMatch) {
            return responseFunction(res, 400, 'Invalid OTP', null, false);
        }

        user = new User({
            name: name,
            email: email,
            password: password,
            profilePic: profilePic
        });

        await user.save();
        //delete user email from verifiaction
        await Verification.deleteOne({ email: email });
        return responseFunction(res, 200, 'registered successfully', null, true);

    }
    catch (err) {
        console.log(err);
        return responseFunction(res, 500, 'Internal server error', null, false);
    }
}

async function loginUser(req, res, next) {
    // console.log(process.env.JWT_SECRET_KEY );
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        
        if (!user) {
            return responseFunction(res, 400, 'User not found', null, false);
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {

            return responseFunction(res, 400, 'Invalid credentials', null, false);
        }


        const authToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY, { expiresIn: '10m' })
        const refreshToken = jwt.sign({ userId: user._id }, process.env.JWT_REFRESH_SECRET_KEY, { expiresIn: '50m' });


        res.cookie('authToken', authToken, {
            sameSite: 'none',
            httpOnly: true,
            secure: true
        });
        res.cookie('refreshToken', refreshToken, {
            sameSite: 'none',
            httpOnly: true,
            secure: true
        });
        return responseFunction(res, 200, 'Logged in successfully', {
            authToken: authToken,
            refreshToken: refreshToken
        }, true);
    }
    catch (err) {
        next(err);
    }
}

async function checkLogin(req, res, next) {
   

    res.json({
        ok: req.ok,
        message: req.message,
        userId: req.userId
    })
}

async function logoutUser(req, res, next) {
    res.clearCookie('authToken');
    res.clearCookie('refreshToken');
    res.json({
        ok: true,
        message: 'Logged out successfully'
    })
}

async function getUser(req, res, next){
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return responseFunction(res, 400, 'User not found', null, false);
        }
        return responseFunction(res, 200, 'User found', user, true);

    }
    catch (err) {
        next(err);
    }
}

async function changePassword(req, res, next) {
    try {
        const { email, otp, password } = req.body;

        let user = await User.findOne({ email: email });
        let verificationQueue = await Verification.findOne({ email: email });
        if (!user) {
            return responseFunction(res, 400, "User doesn't  exist", null, false);
        }

        if (!verificationQueue) {

            return responseFunction(res, 400, 'Please send otp first', null, false);
        }


        const isMatch = await bcrypt.compare(otp, verificationQueue.code);

        if (!isMatch) {
            return responseFunction(res, 400, 'Invalid OTP', null, false);
        }

        user.password = password;
        await user.save();
        await Verification.deleteOne({ email: email });


        return responseFunction(res, 200, 'Password changed successfully', null, true);


    }
    catch (err) {
        next(err);
    }
}

module.exports = {sendOTP,registerUser,loginUser,checkLogin,logoutUser,getUser,changePassword}