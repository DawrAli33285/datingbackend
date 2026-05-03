const express = require("express");
const router = express.Router();
const { updateMe, deleteMyAccount,getMyProfileWithInvited,updatePartnerMode,getMyAccount } = require("../controller/user");
const protect = require("../middlewares/authMiddleware");

router.patch("/me", protect, updateMe);
router.get("/me", protect, getMyProfileWithInvited);
router.patch("/partner-mode", protect, updatePartnerMode);
router.get("/account", protect, getMyAccount);
router.post('/deleteMyAccount',protect,deleteMyAccount)
module.exports = router;