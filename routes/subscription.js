const express = require("express");
const router = express.Router();
const { createSubscription ,cancelSubscription} = require("../controller/subscription");
const protect = require("../middlewares/authMiddleware");

router.post("/create-subscription",protect,createSubscription);
router.post('/cancel-subscription', protect, cancelSubscription);

module.exports = router;