import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import leaveRoutes from "./routes/leaveRoutes.js";
import permissionRoutes from "./routes/permissionRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import seedRoutes from "./routes/seedRoutes.js";

dotenv.config();
connectDB();

const app = express();
app.use("/api/seed", seedRoutes);

// ✅ CORS
app.use(cors({
  origin: "*",   // allow all for now
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.options("*", cors());

app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/permissions", permissionRoutes);
app.use("/api/users", userRoutes);


app.get("/", (req, res) => {
  res.send("✅ Cookscape People Desk API running...");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
