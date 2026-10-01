const express = require("express");

const router = express.Router();

const userController = require("../controllers/userController");
const validate = require("../middleware/validateMiddleware");
const validateId = require("../middleware/validateIdMiddleware");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const { banSchema } = require("../dtos/userDto");

router.use(authMiddleware, adminMiddleware);

router.get("/", userController.getUsers);
router.get("/:id", validateId(), userController.getUserById);
router.patch("/:id/ban", validateId(), validate(banSchema), userController.banUser);
router.patch("/:id/unban", validateId(), userController.unbanUser);

module.exports = router;