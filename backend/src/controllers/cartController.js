const {CartItem, Product} = require("../models/Index");
const CustomError = require("../utils/customError");

const formatCart = (items) => {
  let total = 0;

  const formatted = items.map((item) => {
    const price = Number(item.Product.finalPrice);
    const lineTotal = Number((price * item.quantity).toFixed(2));
    total += lineTotal;

    return {
      productId: item.productId,
      name: item.Product.name,
      imageUrl: item.Product.imageUrl,
      price,
      quantity: item.quantity,
      lineTotal,
      status: item.Product.status
    };
  });

  return { items: formatted, total: Number(total.toFixed(2)) };
};

const getCart = async (req, res, next) => {
  try {
    const items = await CartItem.findAll({
      where: { userId: req.user.id },
      include: [{ model: Product }],
      order: [["id", "ASC"]]
    });

    res.status(200).json(formatCart(items));
  } catch (error) {
    next(error);
  }
};

const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;

    const product = await Product.findByPk(productId);

    if (!product) {
      return next(new CustomError("Product not found.", 404));
    }

    if (product.status !== "Available") {
      return next(new CustomError("This product is currently unavailable.", 400));
    }

    let item = await CartItem.findOne({ where: { userId: req.user.id, productId } });

    if (item) {
      item.quantity = Math.min(item.quantity + quantity, 20);
      await item.save();
    } else {
      item = await CartItem.create({ userId: req.user.id, productId, quantity });
    }

    res.status(200).json({ message: "Item added to cart", item });
  } catch (error) {
    next(error);
  }
};

const updateCartItem = async (req, res, next) => {
  try {
    const productId = Number(req.params.productId);
    const { quantity } = req.body;

    const item = await CartItem.findOne({ where: { userId: req.user.id, productId } });

    if (!item) {
      return next(new CustomError("This item is not in your cart.", 404));
    }

    if (quantity < 1) {
      await item.destroy();
      return res.status(200).json({ message: "Item removed from cart." });
    }

    item.quantity = quantity;
    await item.save();

    res.status(200).json({ message: "Cart updated.", item });
  } catch (error) {
    next(error);
  }
};

const removeFromCart = async (req, res, next) => {
  try {
    const productId = Number(req.params.productId);

    const item = await CartItem.findOne({ where: { userId: req.user.id, productId } });

    if (!item) {
      return next(new CustomError("This item is not in your cart.", 404));
    }

    await item.destroy();

    res.status(200).json({ message: "Item removed from cart." });
  } catch (error) {
    next(error);
  }
};

const clearCart = async (req, res, next) => {
  try {
    await CartItem.destroy({ where: { userId: req.user.id } });

    res.status(200).json({ message: "Cart cleared." });
  } catch (error) {
    next(error);
  }
};

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, clearCart };