const express = require("express");

const router = express.Router();

const productController = require("../controllers/productController");
const validate = require("../middleware/validateMiddleware");
const validateId = require("../middleware/validateIdMiddleware");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const upload = require("../middleware/uploadMiddleware");

const { productSchema } = require("../dtos/productDto");

router.get("/", productController.getProducts);
router.get("/:id", validateId, productController.getProductById);

router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  upload.single("image"),
  validate(productSchema),
  productController.createProduct
);

router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  validateId,
  upload.single("image"),
  validate(productSchema),
  productController.updateProduct
);

router.delete("/:id", authMiddleware, adminMiddleware, validateId, productController.deleteProduct);
router.patch("/:id/availability", authMiddleware, adminMiddleware, validateId, productController.toggleAvailability);

module.exports = router;