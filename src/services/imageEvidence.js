const crypto = require('crypto');
const { imageSize } = require('image-size');

const describeImageBuffer = (buffer, contentType = '', extra = {}) => {
  let dimensions = {};
  try {
    dimensions = imageSize(buffer) || {};
  } catch {
    // Detection will report an invalid image separately. Evidence hashing still works.
  }

  return {
    sha256: crypto.createHash('sha256').update(buffer).digest('hex'),
    bytes: buffer.length,
    contentType: contentType || '',
    width: dimensions.width || null,
    height: dimensions.height || null,
    fetchedAt: new Date().toISOString(),
    ...extra,
  };
};

module.exports = { describeImageBuffer };
