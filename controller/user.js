const User = require("../models/user")
const Invitation = require("../models/invitation"); 
const bcrypt = require('bcrypt');
const Subscription = require("../models/subscription");


const updateMe = async (req, res) => {
  try {
    const { email, password, firstName, pronoun } = req.body; 

    const updateData = {};
    if (email) updateData.email = email;
    if (password) updateData.password = await bcrypt.hash(password, 12);
    if (firstName) updateData.firstName = firstName;
    if (pronoun) updateData.pronoun = pronoun;

    const user = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    res.status(200).json({ message: "Profile updated successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getMyProfileWithInvited = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("email firstName pronoun");

    const invitation = await Invitation.findOne({ invitedBy: req.user._id })
      .select("email firstName");

    res.status(200).json({
      user,
      invitedPerson: invitation || null,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



const updatePartnerMode = async (req, res) => {
  try {
    const { partnerMode } = req.body;

    if (!['together', 'invite', 'explore'].includes(partnerMode)) {
      return res.status(400).json({ message: 'Invalid partner mode' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { partnerMode },
      { new: true }
    ).select('-password');

    res.status(200).json({ message: 'Partner mode saved', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};




const getMyAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('subscription');

    res.status(200).json({ user });
  } catch (error) {
    console.log(error.message)
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};



const deleteMyAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const deletedEmail = `deleteduser+${Date.now()}_${user.email}`;

    await User.findByIdAndUpdate(req.user._id, {
      email: deletedEmail,
      firstName: 'Deleted User',
      password: await bcrypt.hash(Math.random().toString(36), 12),
    });

    res.status(200).json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
module.exports = { updateMe,deleteMyAccount, getMyProfileWithInvited,updatePartnerMode, getMyAccount };