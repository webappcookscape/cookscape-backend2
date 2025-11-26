import mongoose from "mongoose";

const permissionSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    employeeName: {
  type: String,
  required: true
},

    date: { type: Date, required: true },
    fromTime: { type: String, required: true },
    toTime: { type: String, required: true },
    reason: { type: String },
    ceoDecision: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING"
    },
    hrDecision: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING"
    },
    employeeName: {
  type: String,
  required: true
},

    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING"
    },
    ceoDecisionAt: Date,
    hrDecisionAt: Date
  },
  { timestamps: true }
);

const Permission = mongoose.model("Permission", permissionSchema);
export default Permission;
