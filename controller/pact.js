const User = require('../models/user')
const Pact = require("../models/pact");
const PactOptionalTopic = require('../models/pactopticaltopic')
const PactSignature = require("../models/pactsignature");
const Invitation = require('../models/invitation')
const TOPICS = {
  mn: { title: 'Money & finances',       subtitle: 'Who pays what' },
  fi: { title: 'Fidelity & boundaries',  subtitle: 'Exclusivity, limits' },
  ho: { title: 'Home & living together', subtitle: 'Living, space, guests' },
  fu: { title: 'Future plans',           subtitle: 'Kids, career, where' },
  co: { title: 'Conflict & repair',      subtitle: 'How to handle it' },
  se: { title: 'Separation',             subtitle: 'If things end' },
};


const createPact = async (req, res) => {
  try {
    const { partner1Name, partner2Name } = req.body;

    if (!partner1Name || !partner2Name) {
      return res.status(400).json({ message: "Both partner names are required" });
    }

    const pact = await Pact.create({
      partners: [req.user._id],
      partnerNames: { partner1: partner1Name, partner2: partner2Name },
    });

    res.status(201).json({ message: "Pact started", pact });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const submitSectionAnswers = async (req, res) => {
  try {
    const { pactId } = req.params;
    const { topicId, answers } = req.body; 

    const pact = await Pact.findById(pactId);
    if (!pact) return res.status(404).json({ message: "Pact not found" });

    if (!pact.selectedTopics.includes(topicId)) {
      return res.status(400).json({ message: "This topic is not part of the pact" });
    }

    const topicMeta = TOPICS[topicId];

    const existing = await PactOptionalTopic.findOne({ pact: pact._id, title: topicMeta.title });

    if (existing) {
      existing.answers = answers;
      existing.isComplete = true;
      await existing.save();
    } else {
      await PactOptionalTopic.create({
        pact: pact._id,
        title: topicMeta.title,
        subtitle: topicMeta.subtitle,
        answers,
        isComplete: true,
      });
    }

   
    const completedTopics = await PactOptionalTopic.find({ pact: pact._id, isComplete: true });
    const allDone = pact.selectedTopics.every((tid) =>
      completedTopics.some((ct) => ct.title === TOPICS[tid]?.title)
    );

    if (allDone && pact.status === 'in_progress') {
      pact.status = 'draft';
      await pact.save();
    }

    res.status(200).json({
      message: "Topic complete. Your answers have been saved to your pact.",
      topicComplete: true,
      pactStatus: pact.status,
      allTopicsDone: allDone,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getPact = async (req, res) => {
  try {
    const pact = await Pact.findById(req.params.pactId);
    if (!pact) return res.status(404).json({ message: "Pact not found" });

    const topics = await PactOptionalTopic.find({ pact: pact._id }).sort('createdAt');
    const signatures = await PactSignature.find({ pact: pact._id }).populate('user', 'firstName _id'); 

    res.status(200).json({ pact, topics, signatures });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const signPact = async (req, res) => {
  try {
    const { pactId } = req.params;

    const pact = await Pact.findById(pactId);
    if (!pact) return res.status(404).json({ message: 'Pact not found' });

    const alreadySigned = await PactSignature.findOne({ pact: pactId, user: req.user._id });
    if (alreadySigned) {
      return res.status(400).json({ message: 'You have already signed this pact' });
    }

    await PactSignature.create({
      pact: pactId,
      user: req.user._id,
      partnerName: req.user.firstName,
    });

    const signatures = await PactSignature.find({ pact: pactId });
    if (signatures.length >= 2) {
      pact.status = 'signed';
      pact.signedAt = new Date();
      await pact.save();
    }

    res.status(200).json({
      message: signatures.length >= 2 ? 'Pact fully signed!' : 'Signature recorded. Waiting for your partner.',
      pactStatus: pact.status,
      signaturesCount: signatures.length,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};



const getReviewPact = async (req, res) => {
  try {
    const userId = req.user._id;

    const pact = await Pact.findOne({ partners: userId }).populate('partners', 'firstName');
console.log("PACT FOUNd")
console.log(pact)
    if (!pact) {
      return res.status(404).json({ code: 'NO_PACT_YET', message: 'No pact found' });
    }

    const partnerName = pact.partners
      .filter((p) => p._id.toString() !== userId.toString())
      .map((p) => p.firstName)
      .filter(Boolean)
      .join(' & ');

    const topics = await PactOptionalTopic.find({ pact: pact._id }).sort('createdAt');
console.log("TOPICs")
console.log(topics)
    
    const expectedCount = pact.selectedTopics.length;
    const completedCount = topics.filter((t) => t.isComplete).length;
    const allComplete = expectedCount > 0 && completedCount >= expectedCount;
console.log(allComplete)
console.log("allcomplete")
   
    const readyForReview = allComplete || pact.status === 'signed';

    res.status(200).json({
      code: readyForReview ? 'OK' : 'PACT_NOT_READY',
      pactId: pact._id,
      names: partnerName,
      status: pact.status,
      partnerNames: pact.partnerNames,
      selectedTopics: pact.selectedTopics,
      createdAt: pact.createdAt,
      signedAt: pact.signedAt,
      topics: topics.map((t) => ({
        id: t._id,
        title: t.title,
        subtitle: t.subtitle,
        answers: t.answers,
        partnerReview: t.partnerReview,
        isComplete: t.isComplete,
      })),
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


const saveSelectedTopics = async (req, res) => {
  try {
    const userId = req.user._id;
    const currentUser = req.user;
    const { topics } = req.body;
 
    console.log('[saveSelectedTopics] userId:', userId);
    console.log('[saveSelectedTopics] topics:', topics);

    const validTopics = ['mn', 'fi', 'ho', 'fu', 'co', 'se'];

    if (!Array.isArray(topics) || topics.length === 0) {
      return res.status(400).json({ message: "At least one topic is required" });
    }

    const invalid = topics.filter(t => !validTopics.includes(t));
    if (invalid.length > 0) {
      return res.status(400).json({ message: `Invalid topics: ${invalid.join(', ')}` });
    }

    const existingPact = await Pact.findOne({ owner: userId });
    console.log('[saveSelectedTopics] existingPact:', existingPact ? existingPact._id : 'NULL');
    if (existingPact) {
      existingPact.selectedTopics = topics;
      await existingPact.save();

      await PactOptionalTopic.deleteMany({ pact: existingPact._id });
      await PactOptionalTopic.insertMany(
        topics.map(id => ({
          pact: existingPact._id,
          title: TOPICS[id].title,
          subtitle: TOPICS[id].subtitle,
          answers: [],
          isComplete: false,
        }))
      );

      return res.status(200).json({
        message: "Topics updated",
        pactId: existingPact._id,
        selectedTopics: existingPact.selectedTopics,
      });
    }

    const invitation = await Invitation.findOne({ invitedBy: userId, status: "accepted" });
    console.log('[saveSelectedTopics] invitation found:', invitation ? invitation._id : 'NULL');
    console.log('[saveSelectedTopics] invitation.email:', invitation?.email);
    console.log('[saveSelectedTopics] invitation.partnerId:', invitation?.partnerId);
    console.log('[saveSelectedTopics] invitation.status:', invitation?.status);

    if (!invitation) {
      return res.status(400).json({ message: "No accepted partner found. Invite your partner first." });
    }

    let partnerUserId = null;

    if (invitation.email) {
      const partnerUser = await User.findOne({ email: invitation.email });
      console.log('[saveSelectedTopics] email path — partnerUser found:', partnerUser ? partnerUser._id : 'NULL');
      partnerUserId = partnerUser?._id || null;
    } else if (invitation.partnerId) {
      console.log('[saveSelectedTopics] link path — using partnerId:', invitation.partnerId);
      partnerUserId = invitation.partnerId;
    } else {
      console.log('[saveSelectedTopics] WARNING — no email and no partnerId on invitation');
    }

    console.log('[saveSelectedTopics] final partnerUserId:', partnerUserId);
    console.log('[saveSelectedTopics] partners array will be:', partnerUserId ? [userId, partnerUserId] : [userId]);

    const pact = await Pact.create({
      owner: userId,
      partners: partnerUserId ? [userId, partnerUserId] : [userId],
      partnerNames: {
        partner1: currentUser.firstName,
        partner2: invitation.firstName,
      },
      selectedTopics: topics,
    });
    console.log('[saveSelectedTopics] pact created:', pact._id, '| partners:', pact.partners);

    await PactOptionalTopic.insertMany(
      topics.map(id => ({
        pact: pact._id,
        title: TOPICS[id].title,
        subtitle: TOPICS[id].subtitle,
        answers: [],
        isComplete: false,
      }))
    );

    res.status(201).json({ message: "Pact created with topics", pactId: pact._id, selectedTopics: pact.selectedTopics });
  } catch (error) {
    console.log('[saveSelectedTopics] ERROR:', error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getCurrentSection = async (req, res) => {
  try {
    const pact = await Pact.findById(req.params.pactId);
    if (!pact) return res.status(404).json({ message: "Pact not found" });

    const completedTopics = await PactOptionalTopic.find({ pact: pact._id, isComplete: true }).select('title');
    const completedTitles = completedTopics.map(t => t.title);

    const nextTopicId = pact.selectedTopics.find(tid => !completedTitles.includes(TOPICS[tid]?.title));

    if (!nextTopicId) {
      return res.status(200).json({ message: "All topics complete", done: true });
    }

    res.status(200).json({ nextTopicId, title: TOPICS[nextTopicId]?.title });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const checkPartner = async (req, res) => {
  try {
    const userId = req.user._id;

    const pact = await Pact.findOne({ owner: userId });

    if (pact && pact.partners.length >= 2) {
      return res.status(200).json({ hasPartner: true });
    }

    return res.status(200).json({ hasPartner: false });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


const submitPartnerReview = async (req, res) => {
  try {
    const { pactId } = req.params;
    const { reviews } = req.body; 

    for (const r of reviews) {
      await PactOptionalTopic.findByIdAndUpdate(r.topicId, {
        'partnerReview.status': r.status,
      });
    }

    res.status(200).json({ message: 'Partner review saved' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};




const editPartnerReview = async (req, res) => {
  try {
    const { pactId } = req.params;
    const { topicId, status } = req.body;

    const topic = await PactOptionalTopic.findById(topicId);
    if (!topic) return res.status(404).json({ message: "Topic not found" });

    if (!topic.partnerReview?.status) {
      return res.status(400).json({ message: "No existing review to edit" });
    }

    topic.partnerReview.status = status;
    await topic.save();

    res.status(200).json({ message: "Partner review updated", topicId, status });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



const getMyPact = async (req, res) => {
  try {
    console.log("HEY GET MY PACT")
    const pact = await Pact.findOne({
      $or: [{ owner: req.user._id }, { partners: req.user._id }],
    });

    if (!pact) return res.status(404).json({ message: "No pact found" });

    res.status(200).json({ pactId: pact._id });
  } catch (error) {
    console.log(error.message)
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


const validatePromo = async (req, res) => {
  try {
   
    await User.findByIdAndUpdate(req.user._id, { isPremium: true });

    res.status(200).json({
      message: 'Promo code applied successfully',
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


module.exports = { createPact, validatePromo,getMyPact,editPartnerReview ,saveSelectedTopics,submitPartnerReview, getCurrentSection, checkPartner,getReviewPact, submitSectionAnswers, getPact, signPact };