const PactCheckIn = require("../models/pactcheckin");
const PactOptionalTopic = require("../models/pactopticaltopic");
const Pact = require("../models/pact");

const OPTIONAL_TOPICS = [
  { title: "Children", subtitle: "If and when" },
  { title: "Breaking up", subtitle: "Protections" },
  { title: "Finances long-term", subtitle: "Savings & goals" },
  { title: "Family & in-laws", subtitle: "Boundaries" },
];

const startCheckIn = async (req, res) => {
  try {
    const pact = await Pact.findById(req.params.pactId);
    if (!pact) return res.status(404).json({ message: "Pact not found" });

    if (pact.status !== "signed") {
      return res.status(400).json({ message: "Pact must be signed before a check-in" });
    }

    const existing = await PactCheckIn.findOne({ pact: pact._id, status: "in_progress" });
    if (existing) {
      return res.status(400).json({ message: "A check-in is already in progress", checkIn: existing });
    }

    const checkInCount = await PactCheckIn.countDocuments({ pact: pact._id });

   
    const topics = await PactOptionalTopic.find({ pact: pact._id }).sort("createdAt");

    const checkIn = await PactCheckIn.create({
      pact: pact._id,
      checkInNumber: checkInCount + 1,
      sectionReviews: topics.map((t, index) => ({
        sectionIndex: index,
        title: t.title,
        status: "still_works",
      })),
    });

    res.status(201).json({
      message: "Check-in started",
      checkIn,
      sections: topics.map((t, index) => ({
        sectionIndex: index,
        title: t.title,
        summary: t.answers.map((a) => a.answer),
      })),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


const submitCheckIn = async (req, res) => {
  try {
    const { checkInId } = req.params;
    const { reviews } = req.body;

    const checkIn = await PactCheckIn.findById(checkInId);
    if (!checkIn) return res.status(404).json({ message: "Check-in not found" });

    if (checkIn.status === "complete") {
      return res.status(400).json({ message: "This check-in is already complete" });
    }

    reviews.forEach(({ sectionIndex, status }) => {
      const review = checkIn.sectionReviews.find((r) => r.sectionIndex === sectionIndex);
      if (review) review.status = status;
    });

    checkIn.flaggedSections = checkIn.sectionReviews
      .filter((r) => r.status === "needs_chat")
      .map((r) => r.title);

    checkIn.status = "complete";
    checkIn.completedAt = new Date();
    await checkIn.save();

    res.status(200).json({
      message: "Check-in complete",
      flaggedCount: checkIn.flaggedSections.length,
      flaggedSections: checkIn.flaggedSections,
      checkIn,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getOptionalTopics = async (req, res) => {
  try {
    const added = await PactOptionalTopic.find({ pact: req.params.pactId }).select("title");
    const addedTitles = added.map((t) => t.title);

    const available = OPTIONAL_TOPICS.filter((t) => !addedTitles.includes(t.title));

    res.status(200).json({ available, added });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const addOptionalTopic = async (req, res) => {
  try {
    const { title, subtitle, answers } = req.body;

    const pact = await Pact.findById(req.params.pactId);
    if (!pact) return res.status(404).json({ message: "Pact not found" });

    const alreadyAdded = await PactOptionalTopic.findOne({ pact: pact._id, title });
    if (alreadyAdded) {
      return res.status(400).json({ message: `"${title}" has already been added to this pact` });
    }

    const topic = await PactOptionalTopic.create({
      pact: pact._id,
      title,
      subtitle,
      answers: answers || [],
      isComplete: answers?.length > 0,
    });

    res.status(201).json({ message: `"${title}" added to your pact`, topic });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getPactHistory = async (req, res) => {
  try {
    const pact = await Pact.findById(req.params.pactId);
    if (!pact) return res.status(404).json({ message: "Pact not found" });

    const checkIns = await PactCheckIn.find({ pact: pact._id }).sort("createdAt");
    const optionalTopics = await PactOptionalTopic.find({ pact: pact._id }).sort("createdAt");

    const history = [];

    history.push({
      type: "signed",
      label: "Pact signed",
      date: pact.signedAt || pact.createdAt,
    });

    checkIns.forEach((c) => {
      history.push({
        type: "checkin",
        label: `Check-in #${c.checkInNumber}`,
        date: c.completedAt || c.createdAt,
        status: c.status,
        flaggedSections: c.flaggedSections,
      });
    });

    optionalTopics.forEach((t) => {
      history.push({
        type: "topic_added",
        label: `"${t.title}" added`,
        date: t.createdAt,
      });
    });

    history.sort((a, b) => new Date(a.date) - new Date(b.date));

    res.status(200).json({ history });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { startCheckIn, submitCheckIn, getOptionalTopics, addOptionalTopic, getPactHistory };