const mongoose = require("mongoose");
const invitationSchema = new mongoose.Schema(
  {
    email: { type: String, lowercase: true, trim: true },
    firstName: { type: String, required: true },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["pending", "accepted"], default: "pending" },
    token: { type: String, required: true },
    tokenExpiry: { type: Date, required: true },
    partnerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, // ← add this
  },
  { timestamps: true }
);
module.exports = mongoose.model("Invitation", invitationSchema);