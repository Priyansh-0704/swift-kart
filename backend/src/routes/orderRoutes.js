const express = require("express");

const router = express.Router();

const orderController = require("../controllers/orderController");
const validateId = require("../middleware/validateIdMiddleware");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);

router.get("/", orderController.getMyOrders);
router.get("/:id", validateId(), orderController.getMyOrderById);
router.patch("/:id/cancel", validateId(), orderController.cancelMyOrder);

module.exports = router;