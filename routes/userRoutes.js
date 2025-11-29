import express from "express";
import User from "../models/User.js";

const router = express.Router();

// ✅ Get all CEO & Business Heads
router.get("/heads", async (req, res) => {
  try {
    const heads = await User.find({
      role: { $in: ["CEO", "BH"] }
    }).select("_id name role");

    res.json(heads);
  } catch (err) {
    console.error("Fetch heads error:", err);
    res.status(500).json({ message: "Failed to fetch heads" });
  }
});

export default router;
