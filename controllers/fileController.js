const authTokenHandler = require('../middlewares/checkAuthToken');
const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const responseFunction = require("../utils/responseFunction.js")
const dotenv = require('dotenv');
dotenv.config();

//s3 obj
const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
})


//mailer for nee file sent
async function mailer(recieveremail, filesenderemail) {
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
        subject: "New File",
        text: "You recieved a new file from " + filesenderemail,
        html: "<b>You recieved a new file from  " + filesenderemail + "</b>",

    })

    console.log("Message sent: %s", info.messageId);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));

}


const getObjectURL = async (key) => {
    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
    }

    return await getSignedUrl(s3Client, new GetObjectCommand(params));

}

const postObjectURL = async (filename, contentType) => {
    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: filename,
        ContentType: contentType,
    }

    return await getSignedUrl(s3Client, new PutObjectCommand(params));

}


async function Test(req, res) {
    let imgurl = await getObjectURL('myfile803')
    res.send('<img src="' + imgurl + '"/>')

    // let videourl = await getObjectURL('video (2160p).mp4')
    // res.send('<video controls><source src='+videourl+'></video')


    // let ToUploadUrl = await postObjectURL('myfile803','')
    // res.json({
    //     url : ToUploadUrl
    // })
}

async function genereatePostURL(req, res, next) {
    try {
        const timeinms = new Date().getTime();
        const signedUrl = await postObjectURL(timeinms.toString(), '');
        return responseFunction(res, 200, 'signed url generated', {
            signedUrl: signedUrl,
            filekey: timeinms.toString()
        }, true);
    }
    catch (err) {
        next(err);

    }
}

async function shareFile(req, res, next){
    try {
        const { receiveremail, filekey , filename , fileType} = req.body;

        if (!fileType) {
            return responseFunction(res, 400, 'File type is required', null, false);
        }
        // console.log(req.body);
        let senderuser = await User.findOne({ _id: req.userId });
        let recieveruser = await User.findOne({ email: receiveremail });
        if (!senderuser) {
            return responseFunction(res, 400, 'Sender email is not registered', null, false);
        }
        if (!recieveruser) {

  
            return responseFunction(res, 400, 'Reciever email is not registered', null, false);
        }


        if (senderuser.email === receiveremail) {

            return responseFunction(res, 400, 'Reciever email cannot be same as sender', null, false);
        }


        senderuser.files.push({
            senderemail: senderuser.email,
            receiveremail: receiveremail,
            // fileurl: req.file.path,
            fileType:fileType,
            fileurl: filekey,
            filename: filename ? filename : new Date().toLocaleDateString(),
            sharedAt: Date.now(),
            
        })

        recieveruser.files.push({
            senderemail: senderuser.email,
            receiveremail: receiveremail,
            // fileurl: req.file.path,
            fileurl: filekey,
            filename: filename ? filename : new Date().toLocaleDateString(),
            sharedAt: Date.now(),
            fileType:fileType
        })

        await senderuser.save();
        await recieveruser.save();
        
        await mailer(receiveremail, senderuser.email);
        return responseFunction(res, 200, 'shared successfully', null, true);

    }
    catch (err) {
        next(err);
    }
}


async function getFile(req, res, next){
    try {
        let user = await User.findOne({ _id: req.userId });
        if (!user) {
            return responseFunction(res, 400, 'User not found', null, false);
        }
        return responseFunction(res, 200, 'files fetched successfully', user.files, true);
    }
    catch (err) {
        next(err);
    }
}

async function getS3UrlByKey(req, res, next) {
    try {
        const {key} = req.params;
        const signedUrl = await getObjectURL(key);
        if(!signedUrl){
            return responseFunction(res, 400, 'signed url not found', null, false);
        }
        return responseFunction(res, 200, 'signed url generated', {
            signedUrl: signedUrl,
        }, true);
    }
    catch (err) {
        next(err);
    }
}


module.exports = {Test,genereatePostURL,getS3UrlByKey,getFile,shareFile}
