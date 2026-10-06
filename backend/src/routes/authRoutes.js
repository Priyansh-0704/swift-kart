const express = require("express");

const rateLimit = require("express-rate-limit");

const router = express.Router();

const authController = require("../controllers/authController");
const validate = require("../middleware/validateMiddleware");
const authMiddleware = require("../middleware/authMiddleware");

const {
  registerSchema,
  verifyOtpSchema,
  resendOtpSchema,
  loginSchema,
  googleSchema,
  changePasswordSchema,
  updateProfileSchema,
  forgotPasswordRequestSchema,
  forgotPasswordResetSchema
} = require("../dtos/authDto");

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { status: "error", message: "Too many registration attempts. Please try again later." }
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { status: "error", message: "Too many login attempts. Please try again later." }
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: { status: "error", message: "Too many password reset requests. Please try again later." }
});

const googleAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { status: "error", message: "Too many Google login attempts. Please try again later." }
});

router.post("/register", registerLimiter, validate(registerSchema), authController.register);
router.post("/verify-otp", validate(verifyOtpSchema), authController.verifyOtp);
router.post("/resend-otp", validate(resendOtpSchema), authController.resendOtp);
router.post("/login", loginLimiter, validate(loginSchema), authController.login);
router.post("/google", googleAuthLimiter, validate(googleSchema), authController.googleAuth);
router.post("/forgot-password/request-otp", forgotPasswordLimiter, validate(forgotPasswordRequestSchema), authController.requestPasswordResetOtp);
router.post("/forgot-password/reset", validate(forgotPasswordResetSchema), authController.resetPassword);

router.get("/profile", authMiddleware, authController.getProfile);
router.put("/profile", authMiddleware, validate(updateProfileSchema), authController.updateProfile);
router.put("/change-password", authMiddleware, validate(changePasswordSchema), authController.changePassword);

module.exports = router;