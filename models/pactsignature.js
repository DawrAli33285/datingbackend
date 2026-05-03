const mongoose = require("mongoose");

const pactSignatureSchema = new mongoose.Schema(
  {
    pact: { type: mongoose.Schema.Types.ObjectId, ref: "Pact", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    partnerName: { type: String, required: true },
    signedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PactSignature", pactSignatureSchema);