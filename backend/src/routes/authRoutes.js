const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const validate = require("../middleware/validateMiddleware");
const dto = require("../dtos/authDto");

router.post("/send-otp", validate(dto.sendOtpSchema), authController.sendOtp);
router.post("/verify-otp", validate(dto.verifyOtpSchema), authController.verifyOtp);
router.post("/register-profile", validate(dto.registerSchema), authController.completeProfileRegistration);
router.post("/login", validate(dto.loginSchema), authController.login);
router.post("/google", validate(dto.googleLoginSchema), authController.googleAuth);

module.exports = router;