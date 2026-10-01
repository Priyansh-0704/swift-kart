const express = require("express");

const router = express.Router();

const checkoutController = require("../controllers/checkoutController");
const validate = require("../middleware/validateMiddleware");
const authMiddleware = require("../middleware/authMiddleware");

const { createOrderSchema, verifyPaymentSchema } = require("../dtos/checkoutDto");

router.use(authMiddleware);

router.post("/create-order", validate(createOrderSchema), checkoutController.createRazorpayOrder);
router.post("/verify", validate(verifyPaymentSchema), checkoutController.verifyAndPlaceOrder);

module.exports = router;