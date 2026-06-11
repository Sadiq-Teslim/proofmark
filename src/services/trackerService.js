const axios = require('axios');
const { Sighting } = require('../models');
const { searchCopies } = require('./searchProvider');
const fpwm = require('./fpwmClient');

const fetchBytes = async (url) => {
  const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 60000 });
  return Buffer.from(res.data);
};

// Find copies of an image on the web and, where possible, CONFIRM them by reading the
// forensic watermark off the found copy (not just visual similarity — actual mark match).
const scanImage = async (image) => {
  const watermarked = await fetchBytes(image.watermarkedUrl);
  const candidates = await searchCopies(watermarked);

  let created = 0;
  let confirmed = 0;

  for (const candidate of candidates) {
    if (!candidate.pageUrl) continue;

    let isConfirmed = false;
    let payload = null;
    if (candidate.imageUrl) {
      try {
        const bytes = await fetchBytes(candidate.imageUrl);
        const det = await fpwm.detectImage(bytes, 'candidate', image.engine);
        if (det.marked && det.payload === image.payload) {
          isConfirmed = true;
          payload = det.payload;
        }
      } catch (_) { /* candidate not fetchable / not the mark — record as unconfirmed */ }
    }

    try {
      const [, isNew] = await Sighting.findOrCreate({
        where: { imageId: image.id, pageUrl: candidate.pageUrl },
        defaults: {
          userId: image.userId,
          imageUrl: candidate.imageUrl || '',
          source: 'google-vision',
          confirmed: isConfirmed,
          payload,
        },
      });
      if (isNew) created += 1;
      if (isConfirmed) confirmed += 1;
    } catch (_) { /* unique race — ignore */ }
  }

  return { candidates: candidates.length, created, confirmed };
};

module.exports = { scanImage };
