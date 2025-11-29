import express from "express";
import auth from "../middleware/auth.js";
import authorize from "../middleware/role.js";
import Leave from "../models/Leave.js";

const router = express.Router();

const getTodayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

// ====================== EMPLOYEE REQUEST LEAVE ======================
router.post("/", auth, authorize("EMPLOYEE"), async (req, res) => {
  try {
    const { fromDate, toDate, reason, employeeName } = req.body;

    const finalName = employeeName || req.user.name; // ✅ use input or fallback

    const leave = await Leave.create({
      employee: req.user.id,
      employeeName: finalName,
      reportingHead,   // ✅ stored directly in document
      fromDate,
      toDate,
      reason,
    });

    res.status(201).json(leave);
  } catch (err) {
    console.error("Create leave error:", err);
    res.status(500).json({ message: "Failed to create leave" });
  }
});

// ====================== EMPLOYEE MY LEAVES ======================
router.get("/my", auth, authorize("EMPLOYEE"), async (req, res) => {
  try {
    const leaves = await Leave.find({ employee: req.user.id }).sort({
      createdAt: -1
    });
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ message: "Failed to load leaves" });
  }
});

// ====================== CEO: TODAY REQUESTS ======================
router.get("/ceo/today-requests", auth, authorize("CEO"), async (req, res) => {
  try {
    const { start, end } = getTodayRange();

    const leaves = await Leave.find({
      createdAt: { $gte: start, $lte: end },
      ceoDecision: "PENDING"
    }); // ✅ no need populate now

    res.json(leaves);
  } catch (err) {
    res.status(500).json({ message: "Failed to load CEO requests" });
  }
});

// ====================== CEO: TODAY HISTORY ======================
router.get("/ceo/today-history", auth, authorize("CEO"), async (req, res) => {
  try {
    const { start, end } = getTodayRange();

    const leaves = await Leave.find({
      ceoDecisionAt: { $gte: start, $lte: end },
      ceoDecision: { $in: ["APPROVED", "REJECTED"] }
    });

    res.json(leaves);
  } catch (err) {
    res.status(500).json({ message: "Failed to load CEO history" });
  }
});

// ====================== CEO APPROVE / REJECT ======================
router.patch("/ceo/:id", auth, authorize("CEO"), async (req, res) => {
  try {
    const { decision } = req.body;

    if (!["APPROVED", "REJECTED"].includes(decision)) {
      return res.status(400).json({ message: "Invalid decision" });
    }

    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ message: "Leave not found" });

    leave.ceoDecision = decision;
    leave.ceoDecisionAt = new Date();

    if (decision === "REJECTED") {
      leave.status = "REJECTED";
    } else {
      leave.status = leave.hrDecision === "APPROVED" ? "APPROVED" : "PENDING";
    }

    await leave.save();
    res.json(leave);
  } catch (err) {
    console.error("CEO decision error:", err);
    res.status(500).json({ message: "CEO decision failed" });
  }
});

// ====================== HR: TODAY REQUESTS ======================
router.get("/hr/today-requests", auth, authorize("HR"), async (req, res) => {
  try {
    const { start, end } = getTodayRange();

    const leaves = await Leave.find({
      ceoDecision: "APPROVED",
      hrDecision: "PENDING",
      ceoDecisionAt: { $gte: start, $lte: end }
    });

    res.json(leaves);
  } catch (err) {
    res.status(500).json({ message: "Failed to load HR requests" });
  }
});

// ====================== HR: TODAY HISTORY ======================
router.get("/hr/today-history", auth, authorize("HR"), async (req, res) => {
  try {
    const { start, end } = getTodayRange();

    const leaves = await Leave.find({
      hrDecisionAt: { $gte: start, $lte: end },
      hrDecision: { $in: ["APPROVED", "REJECTED"] }
    });

    res.json(leaves);
  } catch (err) {
    res.status(500).json({ message: "Failed to load HR history" });
  }
});

// ====================== HR APPROVE / REJECT ======================
router.patch("/hr/:id", auth, authorize("HR"), async (req, res) => {
  try {
    const { decision } = req.body;

    if (!["APPROVED", "REJECTED"].includes(decision)) {
      return res.status(400).json({ message: "Invalid decision" });
    }

    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ message: "Leave not found" });

    if (leave.ceoDecision !== "APPROVED") {
      return res.status(400).json({ message: "CEO must approve first" });
    }

    leave.hrDecision = decision;
    leave.hrDecisionAt = new Date();

    leave.status = decision === "REJECTED" ? "REJECTED" : "APPROVED";

    await leave.save();
    res.json(leave);
  } catch (err) {
    console.error("HR decision error:", err);
    res.status(500).json({ message: "HR decision failed" });
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

    const leaves = await Leave.find({
      createdAt: { $gte: start, $lt: end }
    });

    let csv = "Employee Name,From,To,CEO Decision,HR Decision,Final Status\n";

    leaves.forEach((l) => {
      csv += `"${l.employeeName}","${l.fromDate.toISOString().slice(0,10)}","${l.toDate.toISOString().slice(0,10)}","${l.ceoDecision}","${l.hrDecision}","${l.status}"\n`;
    });

    res.header("Content-Type", "text/csv");
    res.attachment(`leave-report-${month}.csv`);
    res.send(csv);
  } catch (err) {
    console.error("Report error:", err);
    res.status(500).json({ message: "Failed to generate report" });
  }
});

export default router;
