const UserAddress = require("../models/UserAddress");
const CustomError = require("../utils/customError");

const addAddress = async (req, res, next) => {
  try {
    const {
      label,
      fullName,
      phone,
      addressLine1,
      addressLine2,
      landmark,
      city,
      state,
      pincode,
      country
    } = req.body;

    const address = await UserAddress.create({
      userId: req.user.id,
      label,
      fullName,
      phone,
      addressLine1,
      addressLine2,
      landmark,
      city,
      state,
      pincode,
      country
    });

    res.status(201).json({
      message: "Address added successfully.",
      address
    });
  } catch (error) {
    next(error);
  }
};

const getAddresses = async (req, res, next) => {
  try {
    const addresses = await UserAddress.findAll({
      where: {
        userId: req.user.id
      },
      order: [["id", "DESC"]]
    });

    res.status(200).json({addresses});
  } catch (error) {
    next(error);
  }
};

const getAddressById = async (req, res, next) => {
  try {
    const address = await UserAddress.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!address) {
      return next(new CustomError("Address not found.",404));
    }

    res.status(200).json({address});
  } catch (error) {
    next(error);
  }
};

const updateAddress = async (req, res, next) => {
  try {
    const address = await UserAddress.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!address) {
      return next(new CustomError("Address not found.",404));
    }

    const {
      label,
      fullName,
      phone,
      addressLine1,
      addressLine2,
      landmark,
      city,
      state,
      pincode,
      country
    } = req.body;

    address.label = label;
    address.fullName = fullName;
    address.phone = phone;
    address.addressLine1 = addressLine1;
    address.addressLine2 = addressLine2;
    address.landmark = landmark;
    address.city = city;
    address.state = state;
    address.pincode = pincode;
    address.country = country;

    await address.save();

    res.status(200).json({
      message: "Address updated successfully.",
      address
    });
  } catch (error) {
    next(error);
  }
};

const deleteAddress = async (req, res, next) => {
  try {
    const address = await UserAddress.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!address) {
      return next(new CustomError("Address not found.",404));
    }

    await address.destroy();

    res.status(200).json({message: "Address deleted successfully."});
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addAddress,
  getAddresses,
  getAddressById,
  updateAddress,
  deleteAddress
};