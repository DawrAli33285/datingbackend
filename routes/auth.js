const express = require("express");
const router = express.Router();
const { registerUser, resetPasswordViaToken, forgotPassword,loginUser,googleAuth } = require("../controller/auth");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/reset-password", resetPasswordViaToken);
router.post("/google-auth", googleAuth); 
router.post('/forgot-password', forgotPassword);
module.exports = router;