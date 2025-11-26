import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id, 
      role: user.role,
      name: user.name,
      email: user.email 
    }, 
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

router.post("/seed", async (req, res) => {
  try {
    console.log("🌱 Seeding database...");

    const count = await User.countDocuments();

    // Only seed if DB is empty
    if (count > 0) {
      return res.json({ 
        message: "Database already seeded",
        usersCount: count
      });
    }

    const ceo = await User.create({
      name: "CEO User",
      email: "ceo@cookscape.com",
      password: "password123",
      role: "CEO"
    });

    const hr = await User.create({
      name: "HR User",
      email: "hr@cookscape.com",
      password: "password123",
      role: "HR"
    });

    const emp = await User.create({
      name: "Employee User",
      email: "emp@cookscape.com",
      password: "password123",
      role: "EMPLOYEE"
    });

    res.json({
      message: "✅ Database seeded successfully",
      users: [
        { email: ceo.email, role: ceo.role },
        { email: hr.email, role: hr.role },
        { email: emp.email, role: emp.role }
      ]
    });

  } catch (error) {
    console.error("❌ Seed error:", error);
    res.status(500).json({
      message: "Seed failed",
      error: error.message
    });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user)
      return res.status(401).json({ message: "Invalid email ❌" });

    const isMatch = await user.matchPassword(password);

    if (!isMatch)
      return res.status(401).json({ message: "Invalid password ❌" });

    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;
