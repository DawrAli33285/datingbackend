const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
    },
    role: {
      type: String,
      enum: ['owner', 'partner'],
      default: 'owner',
    },

    isPremium: { type: Boolean, default: false },
    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
      default: null,
    },
    pronoun: {
      type: String,
      enum: ["she/her", "he/him", "they/them", "prefer not to say"],
    },
    isVerified: {
      type: Boolean,
      default: true, 
    },

    partnerMode: {
      type: String,
      enum: ['together', 'invite', 'explore'],
      default: null,
    },
    resetToken: { type: String, default: null },
    resetTokenExpiry: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.models.User || mongoose.model("User", userSchema);