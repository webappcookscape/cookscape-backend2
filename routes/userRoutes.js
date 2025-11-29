import express from "express";
import User from "../models/User.js";

const router = express.Router();

router.get("/heads", async (req, res) => {
  try {
    const heads = await User.find({
      role: { $in: ["COO", "HCF", "BH", "DM"] }
    }).select("_id name role");

    res.json(heads);
  } catch (err) {
    console.error("Error fetching heads:", err);
    res.status(500).json({ message: "Failed to load reporting heads" });
  }
});

export default router;
