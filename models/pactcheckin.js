const mongoose = require("mongoose");

const pactCheckInSchema = new mongoose.Schema(
  {
    pact: { type: mongoose.Schema.Types.ObjectId, ref: "Pact", required: true },
    checkInNumber: { type: Number, required: true },
    sectionReviews: [
      {
        sectionIndex: { type: Number },
        title: { type: String },
        status: { type: String, enum: ["still_works", "needs_chat"], required: true },
      },
    ],
    flaggedSections: [{ type: String }], 
    status: { type: String, enum: ["in_progress", "complete"], default: "in_progress" },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PactCheckIn", pactCheckInSchema);