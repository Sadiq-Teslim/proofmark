const assert = require('node:assert/strict');
const test = require('node:test');

const { describeImageBuffer } = require('../src/services/imageEvidence');

const ONE_PIXEL_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nKsAAAAASUVORK5CYII=',
  'base64'
);

test('records stable forensic metadata for fetched image bytes', () => {
  const first = describeImageBuffer(ONE_PIXEL_PNG, 'image/png');
  const second = describeImageBuffer(ONE_PIXEL_PNG, 'image/png');

  assert.equal(first.sha256, second.sha256);
  assert.match(first.sha256, /^[a-f0-9]{64}$/);
  assert.equal(first.bytes, ONE_PIXEL_PNG.length);
  assert.equal(first.contentType, 'image/png');
  assert.equal(first.width, 1);
  assert.equal(first.height, 1);
});
