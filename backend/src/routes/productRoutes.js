const express = require("express");

const router = express.Router();

const productController = require("../controllers/productController");
const validate = require("../middleware/validateMiddleware");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const {productSchema} = require("../dtos/productDto");

router.get("/",productController.getProducts);
router.get("/:id",productController.getProductById);

router.post(
    "/",
    authMiddleware,
    adminMiddleware,
    validate(productSchema),
    productController.createProduct
);

router.put(
    "/:id",
    authMiddleware,
    adminMiddleware,
    validate(productSchema),
    productController.updateProduct
);

router.delete(
    "/:id",
    authMiddleware,
    adminMiddleware,
    productController.deleteProduct
);

router.patch(
    "/:id/availability",
    authMiddleware,
    adminMiddleware,
    productController.toggleAvailability
);

module.exports = router;