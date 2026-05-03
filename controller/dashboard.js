const User = require('../models/user');
const Pact = require('../models/pact');
const PactCheckIn = require('../models/pactcheckin');
const PactOptionalTopic = require('../models/pactopticaltopic');

const getDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    const pact = await Pact.findOne({ partners: userId }).populate('partners', 'firstName email');

    if (!pact) {
      return res.status(200).json({
        partnerName: null,
        stats: { yearsActive: 0, topicsCount: 0, checkInsCount: 0 },
        pactSections: [],
        optionalTopics: [],
        checkInAvailable: false,
        pactExists: false,
      });
    }

    const partner = pact.partners.find((p) => p._id.toString() !== userId.toString());

  
    const topics = await PactOptionalTopic.find({ pact: pact._id }).sort('createdAt');

    const checkIns = await PactCheckIn.find({ pact: pact._id }).sort('checkInNumber');
    const completedCheckIns = checkIns.filter((c) => c.status === 'complete');

    const msPerYear = 1000 * 60 * 60 * 24 * 365;
    const yearsActive = Math.floor((Date.now() - new Date(pact.createdAt).getTime()) / msPerYear);

    let checkInAvailable = false;
    if (pact.status === 'signed') {
      const lastCompleted = completedCheckIns[completedCheckIns.length - 1];
      if (!lastCompleted) {
        checkInAvailable = yearsActive >= 1;
      } else {
        const lastDate = new Date(lastCompleted.completedAt).getTime();
        checkInAvailable = (Date.now() - lastDate) >= msPerYear;
      }
    }

    const activeCheckIn = checkIns.find((c) => c.status === 'in_progress');

    res.status(200).json({
      pactExists: true,
      partnerName: partner?.firstName || null,
      myName: req.user.firstName,
      stats: {
        yearsActive: yearsActive || 0,
        topicsCount: topics.length,
        checkInsCount: completedCheckIns.length,
      },
      pactSections: topics.map((t, index) => ({
        id: t._id,
        title: t.title,
        sectionIndex: index,
        isComplete: t.isComplete,
        updatedAt: t.updatedAt,
      })),
      optionalTopics: topics.map((t) => ({
        id: t._id,
        title: t.title,
        subtitle: t.subtitle,
        isComplete: t.isComplete,
      })),
      checkInAvailable,
      activeCheckInId: activeCheckIn?._id || null,
      checkInNumber: checkIns.length + 1,
      pactStatus: pact.status,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getDashboard };