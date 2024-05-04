const express = require('express');
const errorHandler = require("../middlewares/errorMiddleware.js");
const authTokenHandler = require("../middlewares/checkAuthToken")
const {Test,genereatePostURL,getFile,getS3UrlByKey,shareFile} = require("../controllers/fileController")

const router = express.Router();

router.get('/test', Test);

router.get('/generatepostobjecturl', authTokenHandler,genereatePostURL)

router.post('/sharefile', authTokenHandler, shareFile)

router.get('/getfiles', authTokenHandler, getFile)


router.get('/gets3urlbykey/:key', authTokenHandler,getS3UrlByKey)

router.use(errorHandler)

module.exports = router;
