const nodemailer = require('nodemailer');

async function mailer(recieveremail, code) {
    let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        requireTLS: true,
        auth: {
            user: process.env.USER_EMAIL,
            pass: process.env.USER_PASS
        }
    })

    let info = await transporter.sendMail({
        from: "Team B-Share",
        to: recieveremail,
        subject: "OTP for verification",
        text: "Your OTP is " + code,
        html: "<b>Your OTP is " + code + "</b>",

    })


}

module.exports = mailer