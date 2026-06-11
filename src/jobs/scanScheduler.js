const cron = require('node-cron');
const { Image } = require('../models');
const { scanImage } = require('../services/trackerService');
const { isConfigured } = require('../services/searchProvider');

// Periodically scan every watermarked image for new copies on the web.
const startScanScheduler = () => {
  if (!isConfigured()) {
    console.log('Tracker scheduler disabled (search provider not configured)');
    return;
  }
  const schedule = process.env.SCAN_CRON || '0 3 * * *'; // daily 03:00
  cron.schedule(schedule, async () => {
    try {
      const images = await Image.findAll();
      for (const image of images) {
        try {
          await scanImage(image);
        } catch (error) {
          console.error('scan error', image.id, error.message);
        }
      }
    } catch (error) {
      console.error('scheduler error', error.message);
    }
  });
  console.log('Tracker scheduler started:', schedule);
};

module.exports = { startScanScheduler };
