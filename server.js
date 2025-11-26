import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import leaveRoutes from "./routes/leaveRoutes.js";
import permissionRoutes from "./routes/permissionRoutes.js";
import cors from "cors";

app.use(
  cors({
    origin: [
      "http://localhost:5173",        // dev
      "https://peopledesk-frontend-w9dk.vercel.app/login", // update after deploy
    ],
    credentials: false,
  })
);

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/permissions", permissionRoutes);

app.get("/", (req, res) => {
  res.send("Cookscape People Desk API running");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
