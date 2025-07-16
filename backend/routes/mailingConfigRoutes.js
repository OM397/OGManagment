const express = require('express');
const router = express.Router();
const MailingConfig = require('../models/MailingConfig');

// GET /api/mailing-config
router.get('/', async (req, res) => {
  try {
    let config = await MailingConfig.findOne();
    if (!config) {
      // Default: Sunday at 10am, default mailBody
      config = await MailingConfig.create({ schedule: { weekday: 0, hour: 10 } });
    }
    res.json({ schedule: config.schedule, mailBody: config.mailBody });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching mailing config' });
  }
});

// POST /api/mailing-config
router.post('/', async (req, res) => {
  try {
    const { weekday, hour, mailBody } = req.body;
    if (typeof weekday !== 'number' || typeof hour !== 'number') {
      return res.status(400).json({ error: 'Invalid schedule' });
    }
    let config = await MailingConfig.findOne();
    if (!config) {
      config = new MailingConfig({ schedule: { weekday, hour }, mailBody });
    } else {
      config.schedule = { weekday, hour };
      if (typeof mailBody === 'string') config.mailBody = mailBody;
    }
    await config.save();
    res.json({ success: true, schedule: config.schedule, mailBody: config.mailBody });
  } catch (err) {
    res.status(500).json({ error: 'Error saving mailing config' });
  }
});

module.exports = router;
