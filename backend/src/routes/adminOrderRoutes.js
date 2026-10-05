const express = require("express");

const router = express.Router();

const orderController = require("../controllers/orderController");
const validate = require("../middleware/validateMiddleware");
const validateId = require("../middleware/validateIdMiddleware");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const { updateStatusSchema } = require("../dtos/orderDto");

router.use(authMiddleware, adminMiddleware);

router.get("/", orderController.getAllOrders);
router.get("/:id", validateId(), orderController.getOrderById);
router.patch("/:id/status", validateId(), validate(updateStatusSchema), orderController.updateOrderStatus);

module.exports = router;