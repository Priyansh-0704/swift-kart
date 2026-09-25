const Product = require("../models/Product");
const CustomError = require("../utils/customError");
const { Op } = require("sequelize")

const calculateFinalPrice = (price, discount) => {
    const finalPrice = price - (price * discount) / 100;

    return Number(finalPrice.toFixed(2));
};

const getProducts = async (req, res, next) => {
    try {
        const search = req.query.search ? req.query.search.trim() : "";
        const page = req.query.page ? Number(req.query.page) : 1;
        const limit = req.query.limit ? Number(req.query.limit) : 10;

        if (!Number.isInteger(page) || page < 1) {
            return next(
                new CustomError(
                    "Page must be a positive integer.",
                    400
                )
            );
        }

        if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
            return next(
                new CustomError(
                    "Limit must be a positive integer between 1 and 50.",
                    400
                )
            );
        }

        const offset = (page - 1) * limit;

        const where = {};

        if (search) {
            where.name = {
                [Op.iLike]: `%${search}%`
            };
        }

        const { count, rows } = await Product.findAndCountAll(
            {
                where,
                order: [["id", "DESC"]],
                limit,
                offset
            }
        );

        const totalPages = Math.ceil(count / limit);

        res.status(200).json({
            products: rows,
            pagination: {
                currentPage: page,
                limit,
                totalProducts: count,
                totalPages
            }
        });
    }
    catch (error) {
        next(error);
    }
};

const getProductById = async (
    req,
    res,
    next
) => {
    try {
        const productId =
            Number(req.params.id);

        if (
            !Number.isInteger(productId) ||
            productId < 1
        ) {
            return next(
                new CustomError(
                    "Invalid product ID.",
                    400
                )
            );
        }

        const product =
            await Product.findByPk(
                productId
            );

        if (!product) {
            return next(
                new CustomError(
                    "Product not found.",
                    404
                )
            );
        }

        res.status(200).json({
            product
        });
    } catch (error) {
        next(error);
    }
};

const createProduct = async (
    req,
    res,
    next
) => {
    try {
        const {
            name,
            description,
            price,
            imageUrl,
            discount
        } = req.body;

        const existingProduct =
            await Product.findOne({
                where: { name }
            });

        if (existingProduct) {
            return next(
                new CustomError(
                    "Product name already exists.",
                    400
                )
            );
        }

        const finalPrice =
            calculateFinalPrice(
                price,
                discount
            );

        const product =
            await Product.create({
                name,
                description,
                price,
                imageUrl,
                discount,
                finalPrice,
                status: "Available"
            });

        res.status(201).json({
            message:
                "Product created successfully.",
            product
        });
    } catch (error) {
        next(error);
    }
};

const updateProduct = async (
    req,
    res,
    next
) => {
    try {
        const productId =
            Number(req.params.id);

        if (
            !Number.isInteger(productId) ||
            productId < 1
        ) {
            return next(
                new CustomError(
                    "Invalid product ID.",
                    400
                )
            );
        }

        const product =
            await Product.findByPk(
                productId
            );

        if (!product) {
            return next(
                new CustomError(
                    "Product not found.",
                    404
                )
            );
        }

        const {
            name,
            description,
            price,
            imageUrl,
            discount
        } = req.body;

        if (name !== product.name) {
            const existingProduct =
                await Product.findOne({
                    where: {
                        name,
                        id: {
                            [Op.ne]: productId
                        }
                    }
                });

            if (existingProduct) {
                return next(
                    new CustomError(
                        "Product name already exists.",
                        400
                    )
                );
            }
        }

        const finalPrice =
            calculateFinalPrice(
                price,
                discount
            );

        product.name = name;
        product.description =
            description;
        product.price = price;
        product.imageUrl = imageUrl;
        product.discount = discount;
        product.finalPrice =
            finalPrice;

        await product.save();

        res.status(200).json({
            message:
                "Product updated successfully.",
            product
        });
    } catch (error) {
        next(error);
    }
};

const deleteProduct = async (
    req,
    res,
    next
) => {
    try {
        const productId =
            Number(req.params.id);

        if (
            !Number.isInteger(productId) ||
            productId < 1
        ) {
            return next(
                new CustomError(
                    "Invalid product ID.",
                    400
                )
            );
        }

        const product =
            await Product.findByPk(
                productId
            );

        if (!product) {
            return next(
                new CustomError(
                    "Product not found.",
                    404
                )
            );
        }

        await product.destroy();

        res.status(200).json({
            message:
                "Product deleted successfully."
        });
    } catch (error) {
        next(error);
    }
};

const toggleAvailability =
    async (
        req,
        res,
        next
    ) => {
        try {
            const productId =
                Number(req.params.id);

            if (
                !Number.isInteger(productId) ||
                productId < 1
            ) {
                return next(
                    new CustomError(
                        "Invalid product ID.",
                        400
                    )
                );
            }

            const product =
                await Product.findByPk(
                    productId
                );

            if (!product) {
                return next(
                    new CustomError(
                        "Product not found.",
                        404
                    )
                );
            }

            if (
                product.status === "Available"
            ) {
                product.status =
                    "Unavailable";
            } else {
                product.status =
                    "Available";
            }

            await product.save();

            res.status(200).json({
                message:
                    "Product availability updated successfully.",
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