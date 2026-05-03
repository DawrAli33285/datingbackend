const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    plan: { type: String, required: true },
    status: {
      type: String,
      enum: ["active", "cancelled", "past_due", "expired"],
      default: "active",
    },
    stripeCustomerId: { type: String, required: true },
    stripeSubscriptionId: { type: String, required: true },
    currentPeriodEnd: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Subscription", subscriptionSchema);