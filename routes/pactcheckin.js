const express = require("express");
const router = express.Router();
const { startCheckIn, submitCheckIn, getOptionalTopics, addOptionalTopic, getPactHistory } = require("../controller/checkin");
const protect = require("../middlewares/authMiddleware");

router.post("/:pactId/checkin", protect, startCheckIn);
router.post("/checkin/:checkInId/submit", protect, submitCheckIn);
router.get("/:pactId/topics", protect, getOptionalTopics);
router.post("/:pactId/topics", protect, addOptionalTopic);
router.get("/:pactId/history", protect, getPactHistory);

module.exports = router;