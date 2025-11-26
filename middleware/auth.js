import jwt from "jsonwebtoken";
import User from "../models/User.js";

const auth = async (req, res, next) => {
  let token = null;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ CASE 1: GMAIL EMPLOYEE (external user)
    if (!decoded.id && decoded.role === "EMPLOYEE") {
      req.user = {
        _id: null,
        name: decoded.name,
        email: decoded.email,
        role: decoded.role,
        isExternal: true
      };
      return next();
    }

    // ✅ CASE 2: DATABASE USER
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    return res.status(401).json({ message: "Token invalid" });
  }
};

export default auth;
