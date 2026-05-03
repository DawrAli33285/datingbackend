const crypto = require("crypto");
const Invitation = require("../models/invitation");
const sendEmail = require("../util/sendEmail");
const Pact =require('../models/pact')

const sendInvitation = async (req, res) => {
  try {
    const { email, firstName } = req.body;

    if (!email || !firstName) {
      return res.status(400).json({ message: "Email and first name are required" });
    }

    
    if (email === req.user.email) {
      return res.status(400).json({ message: "You cannot invite yourself" });
    }

    const existingPact = await Pact.findOne({ owner: req.user._id });
if (existingPact && existingPact.partners.length >= 2) {
  return res.status(400).json({ message: "You already have a partner in your pact. You cannot invite someone else." });
}

    const existing = await Invitation.findOne({
      email,
      status: "pending",
      invitedBy: req.user._id,
      tokenExpiry: { $gt: new Date() }, 
    });
    if (existing) {
      return res.status(400).json({ message: "An invitation has already been sent to this email" });
    }
    

    const token = crypto.randomBytes(32).toString("hex");
    const tokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); 

    const invitation = await Invitation.create({
      email,
      firstName,
      invitedBy: req.user._id,
      token,
      tokenExpiry,
    });

    const inviteLink = `${process.env.BASE_URL}/join?token=${token}`;
    await sendEmail({
      to: email,
      subject: `${req.user.firstName || "Someone"} invited you to join`,
      html: `
  <!DOCTYPE html>
  <html>
  <body style="margin:0;padding:0;background-color:#FAF8F4;font-family:Georgia,serif;">
    <div style="max-width:480px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid rgba(107,45,62,0.13);">
      
      <!-- Header -->
      <div style="background:#6B2D3E;padding:32px 40px;text-align:center;">
        <div style="font-family:Georgia,serif;font-size:28px;color:#FAF8F4;letter-spacing:0.02em;">    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 520 100"
        height={height}
        width={height * 5.2}
      >
        <circle cx="28" cy="50" r="28" fill="none" stroke="#6B2D3E" strokeWidth="1.5" opacity="0.55" />
        <circle cx="52" cy="50" r="28" fill="none" stroke="#6B2D3E" strokeWidth="1.5" opacity="0.55" />
        <path d="M40 24 A28 28 0 0 1 40 76 A28 28 0 0 1 40 24 Z" fill="#6B2D3E" opacity="0.14" />
        <text x="92" y="67" fontFamily="Georgia,'Times New Roman',serif" fontSize="52" fill="#6B2D3E" fontStyle="italic" fontWeight="400" letterSpacing="-1.5">patto</text>
      </svg></div>
        <div style="color:rgba(250,248,244,0.6);font-size:12px;margin-top:4px;letter-spacing:0.08em;text-transform:uppercase;">A shared promise</div>
      </div>

      <!-- Body -->
      <div style="padding:36px 40px;">
        <p style="font-size:22px;color:#2A1A1F;margin:0 0 16px;font-family:Georgia,serif;">
          Hey ${firstName},
        </p>
        <p style="font-size:15px;color:#4A3038;line-height:1.7;margin:0 0 12px;">
          <strong>${req.user.firstName || req.user.email}</strong> invited you to build your Pact together.
        </p>
        <p style="font-size:14px;color:#7A5560;line-height:1.75;margin:0 0 28px;">
          Hey ${firstName}, I found a way to put in writing what we want from each other — not a contract, more like a shared promise. It takes less than an hour together. I think it's worth it.
        </p>
        <p style="font-size:13px;color:#B8999F;margin:0 0 28px;">— ${req.user.firstName || 'Someone'}</p>

        <!-- CTA Button -->
        <div style="text-align:center;margin:0 0 28px;">
          <a href="${inviteLink}" target="_blank"
            style="display:inline-block;background:#6B2D3E;color:#FAF8F4;text-decoration:none;padding:14px 36px;border-radius:12px;font-size:15px;font-family:Georgia,serif;letter-spacing:0.02em;">
            Accept invitation →
          </a>
        </div>

        <p style="font-size:12px;color:#B8999F;text-align:center;margin:0;">
          This link expires in 7 days. If you weren't expecting this, you can safely ignore it.
        </p>
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

    res.status(201).json({ message: `Invitation sent to ${email}` });
  } catch (error) {
    console.log(error.message)
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


const generateInviteLink = async (req, res) => {
  try {
    const { firstName } = req.body;

    if (!firstName) {
      return res.status(400).json({ message: "First name is required" });
    }

    const existingPact = await Pact.findOne({ owner: req.user._id });
    if (existingPact && existingPact.partners.length >= 2) {
      return res.status(400).json({ message: "You already have a partner in your pact. You cannot invite someone else." });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const tokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await Invitation.create({
      email: null,           
      firstName,
      invitedBy: req.user._id,
      token,
      tokenExpiry,
    });

    const inviteLink = `${process.env.BASE_URL}/join?token=${token}`;
    res.status(201).json({ inviteLink });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


const acceptInvitation = async (req, res) => {
  try {
    const token = req.params.token || req.query.token;

    const invitation = await Invitation.findOne({
      token,
      status: "pending",
      tokenExpiry: { $gt: new Date() },
    }).populate('invitedBy', 'firstName email'); 

    if (!invitation) {
      return res.status(400).json({ message: "Invalid or expired invitation link" });
    }

    res.status(200).json({
      message: "Invitation valid",
      email: invitation.email,
      firstName: invitation.firstName,
      invitedByName: invitation.invitedBy?.firstName || invitation.invitedBy?.email || 'Someone', 
    });


  } catch (error) {
    console.log(error.message)
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
module.exports = { sendInvitation, acceptInvitation ,generateInviteLink};