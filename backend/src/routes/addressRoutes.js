const express = require("express");

const router = express.Router();

const addressController = require("../controllers/addressController");
const validate = require("../middleware/validateMiddleware");
const authMiddleware = require("../middleware/authMiddleware");

const {addressSchema} = require("../dtos/addressDto");

router.post("/",authMiddleware,validate(addressSchema),addressController.addAddress);

router.get("/",authMiddleware,addressController.getAddresses);

router.get("/:id",authMiddleware,addressController.getAddressById);

router.put("/:id",authMiddleware,validate(addressSchema),addressController.updateAddress);

router.delete("/:id",authMiddleware,addressController.deleteAddress);

module.exports = router;