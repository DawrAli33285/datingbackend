const mongoose = require("mongoose");

const pactSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    partners: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }],
    partnerNames: {
      partner1: { type: String, required: true },
      partner2: { type: String, required: true },
    },
    status: {
      type: String,
      enum: ["in_progress", "draft", "signed"],
      default: "in_progress",
    },
    currentSection: { type: Number, default: 0 },
    signedAt: { type: Date, default: null },
    selectedTopics: [{ 
  type: String, 
  enum: ['mn', 'fi', 'ho', 'fu', 'co', 'se'] 
}]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Pact", pactSchema);