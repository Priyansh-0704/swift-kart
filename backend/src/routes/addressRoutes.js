const express = require("express");

const router = express.Router();

const addressController = require("../controllers/addressController");
const validate = require("../middleware/validateMiddleware");
const validateId = require("../middleware/validateIdMiddleware");
const authMiddleware = require("../middleware/authMiddleware");

const { addressSchema } = require("../dtos/addressDto");

router.use(authMiddleware);

router.post("/", validate(addressSchema), addressController.addAddress);
router.get("/", addressController.getAddresses);
router.get("/:id", validateId, addressController.getAddressById);
router.put("/:id", validateId, validate(addressSchema), addressController.updateAddress);
router.delete("/:id", validateId, addressController.deleteAddress);

module.exports = router;