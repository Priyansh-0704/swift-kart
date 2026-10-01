const express = require("express");

const router = express.Router();

const cartController = require("../controllers/cartController");
const validate = require("../middleware/validateMiddleware");
const validateId = require("../middleware/validateIdMiddleware");
const authMiddleware = require("../middleware/authMiddleware");

const { addToCartSchema, updateCartSchema } = require("../dtos/cartDto");

router.use(authMiddleware);

router.get("/", cartController.getCart);
router.post("/", validate(addToCartSchema), cartController.addToCart);
router.put("/:productId", validateId("productId"), validate(updateCartSchema), cartController.updateCartItem);
router.delete("/:productId", validateId("productId"), cartController.removeFromCart);
router.delete("/", cartController.clearCart);

module.exports = router;