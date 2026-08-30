const express = require("express");

const router = express.Router();

const authController = require("../controllers/authController");
const validate = require("../middleware/validateMiddleware");
const authMiddleware = require("../middleware/authMiddleware");
const {registerSchema, verifyOtpSchema, loginSchema, /*googleSchema,*/ changePasswordSchema, updateProfileSchema
} = require("../dtos/authDto");

router.post( "/register", validate(registerSchema), authController.register);
router.post( "/verify-otp", validate(verifyOtpSchema), authController.verifyOtp);
router.post( "/login", validate(loginSchema), authController.login);
// router.post( "/google", validate(googleSchema), authController.googleAuth);
router.get( "/profile", authMiddleware, authController.getProfile);
router.put( "/profile", authMiddleware, validate(updateProfileSchema), authController.updateProfile);
router.put( "/change-password", authMiddleware, validate(changePasswordSchema), authController.changePassword);

module.exports = router;