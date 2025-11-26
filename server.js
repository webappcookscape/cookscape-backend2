import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import leaveRoutes from "./routes/leaveRoutes.js";
import permissionRoutes from "./routes/permissionRoutes.js";

dotenv.config();
connectDB();

const app = express();   // ✅ MUST come before app.use()

// ✅ Correct CORS setup
app.use(
  cors({
    origin: [
      "http://localhost:5173",   // local frontend
      "https://peopledesk-frontend-w9dk.vercel.app" // ONLY domain, no /login
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  })
);

app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/permissions", permissionRoutes);

app.get("/", (req, res) => {
  res.send("✅ Cookscape People Desk API running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
