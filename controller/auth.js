const crypto = require("crypto");
const User = require("../models/user");
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const Invitation = require("../models/invitation");
const sendEmail = require("../util/sendEmail");


const registerUser = async (req, res) => {
  try {
    const { email, password, firstName, inviteToken } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    let resolvedFirstName = firstName || '';
    let invitation = null; 
    if (inviteToken) {
      invitation = await Invitation.findOneAndUpdate(
        { token: inviteToken, status: 'pending', tokenExpiry: { $gt: new Date() } },
        { $set: { status: 'accepted' }, $unset: { token: '', tokenExpiry: '' } },
        { returnDocument: 'after' }
      );

      if (!invitation) {
        return res.status(400).json({ message: "Invalid or expired invite link." });
      }

      resolvedFirstName = invitation.firstName;
    }

    const user = await User.create({
      email,
      password: hashedPassword,
      firstName: resolvedFirstName,
      isVerified: true,
      role: inviteToken ? 'partner' : 'owner',
    });

    if (invitation) {
      const Pact = require('../models/pact');
      const updatedPact = await Pact.findOneAndUpdate(
        { owner: invitation.invitedBy },
        { $addToSet: { partners: user._id } }
      );

      if (!updatedPact) {
        await Invitation.findByIdAndUpdate(invitation._id, { partnerId: user._id });
        console.log('[registerUser] pact not found — saved partnerId:', user._id, 'to invitation:', invitation._id);
      }

      const inviter = await User.findById(invitation.invitedBy);
  if (inviter) {
    await sendEmail({
      to: inviter.email,
      subject: `${user.firstName} accepted your invitation`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;background-color:#FAF8F4;font-family:Georgia,serif;">
          <div style="max-width:480px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid rgba(107,45,62,0.13);">
            
            <!-- Header -->
            <div style="background:#6B2D3E;padding:32px 40px;text-align:center;">
              <div style="font-family:Georgia,serif;font-size:28px;color:#FAF8F4;letter-spacing:0.02em;">patto</div>
              <div style="color:rgba(250,248,244,0.6);font-size:12px;margin-top:4px;letter-spacing:0.08em;text-transform:uppercase;">A shared promise</div>
            </div>

            <!-- Body -->
            <div style="padding:36px 40px;">
              <p style="font-size:22px;color:#2A1A1F;margin:0 0 16px;font-family:Georgia,serif;">
                Your invitation was accepted 🎉
              </p>
              <p style="font-size:15px;color:#4A3038;line-height:1.7;margin:0 0 24px;">
                <strong>${user.firstName}</strong> just joined Patto and is now part of your pact.
              </p>
              <p style="font-size:14px;color:#7A5560;line-height:1.75;margin:0 0 28px;">
                You can now build your shared promise together.
              </p>

              <!-- CTA Button -->
              
            </div>

            <!-- Footer -->
            <div style="border-top:1px solid rgba(107,45,62,0.08);padding:20px 40px;text-align:center;">
              <p style="font-size:11px;color:#C9B0B5;margin:0;">Made with care · Patto</p>
            </div>

          </div>
        </body>
        </html>
      `,
    });
  }
    }

    res.status(201).json({
      message: "Registration successful. You can now log in.",
      user: { id: user._id, email: user.email, firstName: user.firstName },
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    });

    res.status(200).json({
      message: 'Login successful',
      token,
      user: { id: user._id, email: user.email, firstName: user.firstName, partnerMode: user.partnerMode, role: user.role },
    });


  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "No account found with that email" });

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000);

    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();

    const resetLink = `${process.env.BASE_URL}/reset-password?token=${resetToken}`;
    await sendEmail({
      to: email,
      subject: "Reset your password",
      html: `
        <h2>Hi ${user.firstName || ""}!</h2>
        <p>We received a request to reset your password.</p>
        <p>Click the link below to set a new password:</p>
        <a href="${resetLink}" target="_blank">Reset Password</a>
        <p>This link expires in <strong>15 minutes</strong>.</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
      `,
    });

    res.status(200).json({ message: "Reset link sent to your email" });
  } catch (error) {
    console.log("GOOTAUTH")
    console.log(error.message)
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const resetPasswordViaToken = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ message: "Token and new password are required" });

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() },
    });

   
    if (!user) return res.status(400).json({ message: "Invalid or expired reset link" });

    user.password = await bcrypt.hash(newPassword, 12);
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.log("ERROR")
    console.log(error.message)
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


const googleAuth = async (req, res) => {
  try {
    const { email, firstName, inviteToken } = req.body;

    console.log("=== GOOGLE AUTH START ===");
    console.log("Body received:", { email, firstName, inviteToken });

    if (!email) {
      console.log("❌ EMAIL NOT FOUND IN BODY");
      return res.status(400).json({ message: 'Email is required' });
    }

    console.log("🔍 Looking up user by email:", email);
    let user = await User.findOne({ email });
    console.log("User found:", user ? `YES (id: ${user._id})` : "NO");

    let invitedBy = null;

    if (inviteToken) {
      console.log("🔑 inviteToken present:", inviteToken);

      console.log("🔍 Looking up invitation...");
      const invitation = await Invitation.findOneAndUpdate(
        { token: inviteToken, tokenExpiry: { $gt: new Date() } },
        { $set: { status: 'accepted' }, $unset: { token: '', tokenExpiry: '' } },
        { returnDocument: 'after' }
      );
      console.log("Invitation found:", invitation ? `YES (id: ${invitation._id})` : "NO — invalid or expired");

      if (!invitation) {
        return res.status(400).json({ message: 'Invalid or expired invite link.' });
      }

      invitedBy = invitation.invitedBy;
      console.log("invitedBy:", invitedBy);

      if (!user) {
        console.log("👤 No existing user — creating new partner user...");
        const randomPassword = await bcrypt.hash(crypto.randomUUID(), 12);
        user = await User.create({
          email,
          firstName: invitation.firstName,
          password: randomPassword,
          isVerified: true,
          role: 'partner',
        });
        console.log("✅ New partner user created:", user._id);
      } else {
        console.log("👤 Existing user found, skipping creation");
      }

      console.log("🔍 Looking up Pact for invitedBy:", invitedBy);
      const Pact = require('../models/pact');
      const updatedPact = await Pact.findOneAndUpdate(
        { owner: invitation.invitedBy },
        { $addToSet: { partners: user._id } }
      );
    
      if (!updatedPact) {
        await Invitation.findByIdAndUpdate(invitation._id, { partnerId: user._id });
        console.log('[registerUser] pact not found — saved partnerId:', user._id, 'to invitation:', invitation._id);
      }
     
      
    } else if (!user) {
      console.log("👤 No inviteToken and no existing user — creating new owner...");
      const randomPassword = await bcrypt.hash(crypto.randomUUID(), 12);
      user = await User.create({
        email,
        firstName: firstName || '',
        password: randomPassword,
        isVerified: true,
        role: 'owner',
      });
      console.log("✅ New owner user created:", user._id);
    } else {
      console.log("👤 Existing user, no invite — proceeding to login");
    }

    console.log("🔐 Signing JWT for user:", user._id);
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
    console.log("✅ JWT signed successfully");

    console.log("=== GOOGLE AUTH SUCCESS ===");
    res.status(200).json({
      message: 'Google login successful',
      token,
      user: { id: user._id, email: user.email, firstName: user.firstName, partnerMode: user.partnerMode, role: user.role },
    });
  } catch (error) {
    console.log("=== GOOGLE AUTH ERROR ===");
    console.log("Message:", error.message);
    console.log("Stack:", error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};



module.exports = {
  registerUser,
  loginUser,
  resetPasswordViaToken,
  forgotPassword,
  googleAuth
};