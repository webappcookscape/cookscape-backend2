import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

// Generate token
const generateToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });

// ---------------- SEED ROUTE ----------------
router.post("/seed", async (req, res) => {
  try {
    await User.deleteMany({});

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
      message: "✅ Seeded users",
      users: [
        { email: ceo.email, role: ceo.role },
        { email: hr.email, role: hr.role },
        { email: emp.email, role: emp.role }
      ]
    });
  } catch (err) {
    console.error("Seed error:", err);
    res.status(500).json({ message: "Seed failed" });
  }
});

// ---------------- LOGIN ROUTE ----------------
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid email ❌" });
    }

    const match = await user.matchPassword(password);
    if (!match) {
      return res.status(401).json({ message: "Invalid password ❌" });
    }

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
    res.status(500).json({ message: "Server error" });
  }
});



export default router;
