import express from "express";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

const router = express.Router();

router.get("/seed-heads", async (req, res) => {
  const heads = [
    { name: "Leo", email: "leo@cookscape.com", role: "COO" },
    { name: "Ramya", email: "ramya@cookscape.com", role: "HCF" },
    { name: "Tamizh", email: "tamizh@cookscape.com", role: "BH" },
    { name: "Rajkumar", email: "rajkumar@cookscape.com", role: "BH" },
    { name: "Pughazh", email: "pughazh@cookscape.com", role: "DM" }
  ];

  try {
    for (let h of heads) {
      const exists = await User.findOne({ email: h.email });
      if (!exists) {
        const hashed = await bcrypt.hash("123456", 10);
        await User.create({ ...h, password: hashed });
      }
    }

    res.json({ message: "5 heads created successfully!" });
  } catch (err) {
    res.status(500).json({ message: "Error creating heads", err });
  }
});

export default router;
