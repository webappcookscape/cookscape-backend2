import express from "express";
import auth from "../middleware/auth.js";
import authorize from "../middleware/role.js";
import Permission from "../models/Permission.js";

const router = express.Router();

const getTodayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

// ====================== EMPLOYEE: REQUEST PERMISSION ======================
router.post("/", auth, authorize("EMPLOYEE"), async (req, res) => {
  try {
    const { date, fromTime, toTime, reason, employeeName } = req.body;

    const finalName = employeeName || req.user.name;

    const perm = await Permission.create({
      employee: req.user.id,
      employeeName: finalName,    // ✅ Editable name support
      date,
      fromTime,
      toTime,
      reason,
    });

    res.status(201).json(perm);
  } catch (err) {
    console.error("Permission create error:", err);
    res.status(500).json({ message: "Permission request failed" });
  }
});

// ====================== EMPLOYEE: MY PERMISSIONS ======================
router.get("/my", auth, authorize("EMPLOYEE"), async (req, res) => {
  try {
    const perms = await Permission.find({ employee: req.user.id }).sort({
      createdAt: -1,
    });

    res.json(perms);
  } catch (err) {
    console.error("Permission my error:", err);
    res.status(500).json({ message: "Failed to load permissions" });
  }
});

// ====================== CEO: TODAY REQUESTS ======================
router.get("/ceo/today-requests", auth, authorize("CEO"), async (req, res) => {
  try {
    const { start, end } = getTodayRange();

    const perms = await Permission.find({
      createdAt: { $gte: start, $lte: end },
      ceoDecision: "PENDING",
    });

    res.json(perms);
  } catch (err) {
    console.error("CEO perm requests error:", err);
    res.status(500).json({ message: "Failed to load CEO permission requests" });
  }
});

// ====================== CEO: TODAY HISTORY ======================
router.get("/ceo/today-history", auth, authorize("CEO"), async (req, res) => {
  try {
    const { start, end } = getTodayRange();

    const perms = await Permission.find({
      ceoDecisionAt: { $gte: start, $lte: end },
      ceoDecision: { $in: ["APPROVED", "REJECTED"] },
    });

    res.json(perms);
  } catch (err) {
    console.error("CEO perm history error:", err);
    res.status(500).json({ message: "Failed to load CEO permission history" });
  }
});

// ====================== CEO APPROVE / REJECT ======================
router.patch("/ceo/:id", auth, authorize("CEO"), async (req, res) => {
  try {
    const { decision } = req.body;

    if (!["APPROVED", "REJECTED"].includes(decision)) {
      return res.status(400).json({ message: "Invalid decision" });
    }

    const perm = await Permission.findById(req.params.id);
    if (!perm) return res.status(404).json({ message: "Permission not found" });

    perm.ceoDecision = decision;
    perm.ceoDecisionAt = new Date();

    if (decision === "REJECTED") {
      perm.status = "REJECTED";
    } else {
      perm.status = perm.hrDecision === "APPROVED" ? "APPROVED" : "PENDING";
    }

    await perm.save();
    res.json(perm);
  } catch (err) {
    console.error("CEO perm decision error:", err);
    res.status(500).json({ message: "CEO permission decision failed" });
  }
});

// ====================== HR: TODAY REQUESTS ======================
router.get("/hr/today-requests", auth, authorize("HR"), async (req, res) => {
  try {
    const { start, end } = getTodayRange();

    const perms = await Permission.find({
      ceoDecision: "APPROVED",
      hrDecision: "PENDING",
      ceoDecisionAt: { $gte: start, $lte: end },
    });

    res.json(perms);
  } catch (err) {
    console.error("HR perm requests error:", err);
    res.status(500).json({ message: "Failed to load HR permission requests" });
  }
});

// ====================== HR: TODAY HISTORY ======================
router.get("/hr/today-history", auth, authorize("HR"), async (req, res) => {
  try {
    const { start, end } = getTodayRange();

    const perms = await Permission.find({
      hrDecisionAt: { $gte: start, $lte: end },
      hrDecision: { $in: ["APPROVED", "REJECTED"] },
    });

    res.json(perms);
  } catch (err) {
    console.error("HR perm history error:", err);
    res.status(500).json({ message: "Failed to load HR permission history" });
  }
});

// ====================== HR APPROVE / REJECT ======================
router.patch("/hr/:id", auth, authorize("HR"), async (req, res) => {
  try {
    const { decision } = req.body;

    if (!["APPROVED", "REJECTED"].includes(decision)) {
      return res.status(400).json({ message: "Invalid decision" });
    }

    const perm = await Permission.findById(req.params.id);
    if (!perm) return res.status(404).json({ message: "Permission not found" });

    if (perm.ceoDecision !== "APPROVED") {
      return res.status(400).json({ message: "CEO must approve first" });
    }

    perm.hrDecision = decision;
    perm.hrDecisionAt = new Date();
    perm.status = decision === "REJECTED" ? "REJECTED" : "APPROVED";

    await perm.save();
    res.json(perm);
  } catch (err) {
    console.error("HR perm decision error:", err);
    res.status(500).json({ message: "HR permission decision failed" });
  }
});

// ====================== HR MONTHLY CSV REPORT ======================
router.get("/hr/report", auth, authorize("HR"), async (req, res) => {
  try {
    const { month } = req.query;

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ message: "Month must be YYYY-MM" });
    }

    const [yearStr, monthStr] = month.split("-");
    const year = parseInt(yearStr, 10);
    const m = parseInt(monthStr, 10) - 1;

    const start = new Date(year, m, 1);
    const end = new Date(year, m + 1, 1);

    const perms = await Permission.find({
      createdAt: { $gte: start, $lt: end },
    });

    let csv =
      "Employee Name,Date,From,To,CEO Decision,HR Decision,Final Status\n";

    perms.forEach((p) => {
      csv += `"${p.employeeName}","${p.date.toISOString().slice(0, 10)}","${p.fromTime}","${p.toTime}","${p.ceoDecision}","${p.hrDecision}","${p.status}"\n`;
    });

    res.header("Content-Type", "text/csv");
    res.attachment(`permission-report-${month}.csv`);
    res.send(csv);
  } catch (err) {
    console.error("Permission report error:", err);
    res.status(500).json({ message: "Failed to generate permission report" });
  }
});

export default router;
