const express = require("express");
const router = express.Router();
const { createPact, getCurrentSection, validatePromo,getReviewPact,editPartnerReview,checkPartner,submitSectionAnswers,submitPartnerReview,saveSelectedTopics, getPact, signPact, getMyPact } = require("../controller/pact");
const protect = require("../middlewares/authMiddleware");


router.get("/pact/review/me", protect, getReviewPact);
router.post("/pact/topics", protect, saveSelectedTopics);
router.post("/", protect, createPact);
router.get("/:pactId/section", protect, getCurrentSection);
router.post("/:pactId/section", protect, submitSectionAnswers);
router.get("/pact/:pactId", protect, getPact);
router.post("/:pactId/sign", protect, signPact);

router.post('/:pactId/partner-review', protect, submitPartnerReview);

router.get('/invitations/check-partner', protect, checkPartner);
router.put('/:pactId/partner-review', protect, editPartnerReview);
router.get("/getpact/me", protect, getMyPact)

router.post('/promo/validate',protect,validatePromo)
module.exports = router;