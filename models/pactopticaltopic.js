const mongoose = require("mongoose");

const pactOptionalTopicSchema = new mongoose.Schema(
  {
    pact: { type: mongoose.Schema.Types.ObjectId, ref: "Pact", required: true },
    title: { type: String, required: true },      
    subtitle: { type: String },                   
    answers: [
      {
        question: { type: String },
        answer: { type: String },
      },
    ],
    partnerReview: {
      status: { type: String, enum: ['agree', 'agree_with_change', 'needs_talk'], default: null }
    },
    isComplete: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PactOptionalTopic", pactOptionalTopicSchema);