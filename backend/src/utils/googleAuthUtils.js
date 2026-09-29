const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const CustomError = require("./customError");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const getGooglePayload = async (idToken) => {
  let payload;

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    payload = ticket.getPayload();
  } catch (error) {
    throw new CustomError("Invalid Google token.", 401);
  }

  if (!payload.email || !payload.email_verified) {
    throw new CustomError("Google email could not be verified.", 401);
  }

  return payload;
};

const makeUsername = async (email) => {
  let base = email.split("@")[0].replace(/[^a-z0-9]/g, "").slice(0, 18);

  if (base.length < 3) {
    base = "user" + base;
  }

  let username = base;

  while (await User.findOne({ where: { username } })) {
    username = base + crypto.randomInt(1000, 10000);
  }

  return username;
};

module.exports = { getGooglePayload, makeUsername };