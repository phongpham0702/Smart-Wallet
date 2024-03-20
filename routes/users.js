const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const userController = require("../controllers/userController");


/* GET users listing. */
router.route("/forgotpassword").get(userController.getForgotPasswordForm).post(userController.postForgotPasswordForm)
router.route("/recover").get(userController.getOTPForm).post(userController.postOTPResetPassword);


module.exports = router;