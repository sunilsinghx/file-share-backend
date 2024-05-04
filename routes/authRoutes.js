const express = require("express");
const errorHandler = require("../middlewares/errorMiddleware.js");
const  authTokenHandler = require("../middlewares/checkAuthToken.js");

const router = express.Router();

const {
  sendOTP,
  registerUser,
  loginUser,
  checkLogin,
  logoutUser,
  getUser,
  changePassword
} = require("../controllers/authController.js");


router.use(errorHandler);

router.get("/test", (req, res) => {
  res.send("Auth routes are working!");

  // mailer("codershub.2430@gmail.com", 12345)
});

router.post("/sendotp", sendOTP);

router.post("/register", registerUser);

// router.post('/updatepassword', async (req, res, next) => {})

router.post("/login", loginUser);

router.get("/checklogin", authTokenHandler, checkLogin);

router.post("/logout", authTokenHandler, logoutUser);

router.get("/getuser", authTokenHandler, getUser);

router.post("/changepassword", changePassword);





module.exports = router;
