const express = require("express");
const router = express.Router();
const { sendInvitation, acceptInvitation,generateInviteLink } = require("../controller/invitation");
const protect = require("../middlewares/authMiddleware");

router.post("/invitations/send", protect, sendInvitation);   
router.post('/invitations/generateInviteLink',protect,generateInviteLink)   
router.get("/invitations/accept/:token", acceptInvitation);
router.get("/invitations/preview", acceptInvitation);


module.exports = router;