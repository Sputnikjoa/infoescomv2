// middleware/auth.js
const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  // El token se espera en el header "Authorization" en formato "Bearer <token>"
  const token = req.header("Authorization")?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Acceso denegado" });
  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ message: "Token inválido" });
  }
};

module.exports = auth;
