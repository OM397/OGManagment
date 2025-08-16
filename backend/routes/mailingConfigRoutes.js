const express = require('express');
const router = express.Router();
const MailingConfig = require('../models/MailingConfig');

// GET /api/mailing-config
router.get('/', async (req, res) => {
  try {
    let config = await MailingConfig.findOne();
    if (!config) {
      config = await MailingConfig.create({ schedule: { weekdays: [0], hour: 10 } });
    }
    // Migración en memoria si es legado (weekday singular)
    if (config.schedule && !config.schedule.weekdays) {
      const legacyDay = typeof config.schedule.weekday === 'number' ? config.schedule.weekday : 0;
      config.schedule.weekdays = [legacyDay];
      delete config.schedule.weekday;
      await config.save();
    }
    res.json({ schedule: { weekdays: config.schedule.weekdays, hour: config.schedule.hour }, mailBody: config.mailBody });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching mailing config' });
  }
});

// POST /api/mailing-config
router.post('/', async (req, res) => {
  try {
    let { weekdays, hour, mailBody } = req.body;
    if (!Array.isArray(weekdays) || weekdays.length === 0 || typeof hour !== 'number') {
      return res.status(400).json({ error: 'Invalid schedule (weekdays array & hour required)' });
    }
    weekdays = [...new Set(weekdays.filter(d => typeof d === 'number' && d >= 0 && d <= 6))].sort();
    if (weekdays.length === 0) return res.status(400).json({ error: 'No valid weekdays provided' });
    let config = await MailingConfig.findOne();
    if (!config) {
      config = new MailingConfig({ schedule: { weekdays, hour }, mailBody });
    } else {
      config.schedule = { weekdays, hour };
      if (typeof mailBody === 'string') config.mailBody = mailBody;
    }
    await config.save();
    res.json({ success: true, schedule: { weekdays: config.schedule.weekdays, hour: config.schedule.hour }, mailBody: config.mailBody });
  } catch (err) {
    res.status(500).json({ error: 'Error saving mailing config' });
  }
});

module.exports = router;
