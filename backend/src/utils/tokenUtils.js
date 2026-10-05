const jwt = require("jsonwebtoken");

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role, tokenVersion: user.tokenVersion }, process.env.JWT_SECRET, { expiresIn: "7d" }
  );
};

const formatUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  username: user.username,
  role: user.role
});

const sendAuthResponse = (res, user, message) => {
  res.status(200).json({
    message,
    token: generateToken(user),
    user: formatUser(user)
  });
};

module.exports = { generateToken, formatUser, sendAuthResponse };