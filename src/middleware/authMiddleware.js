const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {

    // GET TOKEN FROM HEADER
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: "Access denied. No token provided",
      });
    }

    // FORMAT:
    // Bearer TOKEN
    const token = authHeader.split(" ")[1];

    // VERIFY TOKEN
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // SAVE USER DATA
    req.user = decoded;

    next();

  } catch (error) {
    console.error(error);

    res.status(401).json({
      message: "Invalid token",
    });
  }
};

module.exports = authMiddleware;