const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config");

// Middleware to verify JWT token for protected routes
const authMiddleware = (req, res, next) => {
  try {
    // Check for Bearer token in headers
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ error: "Access denied. No token provided." });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // attach decoded user data (like user.id) to request
    next();
  } catch (err) {
    console.error("Auth Middleware Error:", err.message);
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

module.exports = authMiddleware;