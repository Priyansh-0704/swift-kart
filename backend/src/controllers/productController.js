const Product = require("../models/Product");
const CustomError = require("../utils/customError");
const { Op } = require("sequelize");
const { uploadImage, deleteImage } = require("../services/imageService");

const calculateFinalPrice = (price, discount) => {
  const finalPrice = price - (price * discount) / 100;
  return Number(finalPrice.toFixed(2));
};

const findProduct = async (id) => {
  const product = await Product.findByPk(id);

  if (!product) {
    throw new CustomError("Product not found.", 404);
  }

  return product;
};

const nameIsTaken = async (name, excludeId) => {
  const where = { name };

  if (excludeId) {
    where.id = { [Op.ne]: excludeId };
  }

  const existing = await Product.findOne({ where });
  return !!existing;
};

const getProducts = async (req, res, next) => {
  try {
    const search = String(req.query.search || "").trim();
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 10;

    if (!Number.isInteger(page) || page < 1) {
      return next(new CustomError("Page must be a positive integer.", 400));
    }

    if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
      return next(new CustomError("Limit must be a positive integer between 1 and 50.", 400));
    }

    const where = {};

    if (search) {
      const safeSearch = search.replace(/[%_\\]/g, "\\$&");
      where.name = { [Op.iLike]: `%${safeSearch}%` };
    }

    const { count, rows } = await Product.findAndCountAll({
      where,
      order: [["id", "DESC"]],
      limit,
      offset: (page - 1) * limit
    });

    res.status(200).json({
      products: rows,
      pagination: {
        currentPage: page,
        limit,
        totalProducts: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const product = await findProduct(Number(req.params.id));

    res.status(200).json({ product });
  } catch (error) {
    next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const { name, description, price, discount } = req.body;

    if (await nameIsTaken(name)) {
      return next(new CustomError("Product name already exists.", 400));
    }

    let imageUrl = null;
    let imagePublicId = null;

    if (req.file) {
      const uploaded = await uploadImage(req.file.buffer);
      imageUrl = uploaded.url;
      imagePublicId = uploaded.publicId;
    }

    const product = await Product.create({
      name,
      description,
      price,
      imageUrl,
      imagePublicId,
      discount,
      finalPrice: calculateFinalPrice(price, discount),
      status: "Available"
    });

    res.status(201).json({ message: "Product created successfully.", product });
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const productId = Number(req.params.id);
    const product = await findProduct(productId);

    const { name, description, price, discount } = req.body;

    if (name !== product.name && (await nameIsTaken(name, productId))) {
      return next(new CustomError("Product name already exists.", 400));
    }

    if (req.file) {
      const uploaded = await uploadImage(req.file.buffer);
      const oldPublicId = product.imagePublicId;

      product.imageUrl = uploaded.url;
      product.imagePublicId = uploaded.publicId;

      if (oldPublicId) {
        await deleteImage(oldPublicId);
      }
    }

    product.name = name;
    product.description = description;
    product.price = price;
    product.discount = discount;
    product.finalPrice = calculateFinalPrice(price, discount);

    await product.save();

    res.status(200).json({ message: "Product updated successfully.", product });
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const product = await findProduct(Number(req.params.id));
    const publicId = product.imagePublicId;

    await product.destroy();

    if (publicId) {
      await deleteImage(publicId);
    }

    res.status(200).json({ message: "Product deleted successfully." });
  } catch (error) {
    next(error);
  }
};

const toggleAvailability = async (req, res, next) => {
  try {
    const product = await findProduct(Number(req.params.id));

    product.status = product.status === "Available" ? "Unavailable" : "Available";
    await product.save();

    res.status(200).json({
      message: "Product availability updated successfully.",
      status: product.status
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleAvailability
};