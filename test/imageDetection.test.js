const assert = require('node:assert/strict');
const test = require('node:test');

const {
  candidateSizesFor,
  detectWithKnownEngines,
} = require('../src/services/imageDetection');

test('deduplicates original-size hints', () => {
  assert.deepEqual(candidateSizesFor([
    { width: 1200, height: 800 },
    { width: 1200, height: 800 },
    { width: 640, height: 640 },
    { width: null, height: null },
  ]), [[1200, 800], [640, 640]]);
});

test('returns not found only after every detector completes', async () => {
  const result = await detectWithKnownEngines({
    buffer: Buffer.from('same-image'),
    filename: 'copy.jpg',
    knownImages: [{ engine: 'qim-dct', width: 1200, height: 800 }],
    defaultEngine: 'qim-dct',
    detectImage: async () => ({ marked: false, payload: null, requestAttempts: 1 }),
  });

  assert.equal(result.marked, false);
  assert.equal(result.verificationAttempts[0].status, 'completed');
});

test('does not turn a detector outage into not found', async () => {
  await assert.rejects(
    detectWithKnownEngines({
      buffer: Buffer.from('same-image'),
      filename: 'copy.jpg',
      knownImages: [{ engine: 'qim-dct', width: 1200, height: 800 }],
      defaultEngine: 'qim-dct',
      detectImage: async () => {
        const error = new Error('upstream timeout');
        error.detectionAttempts = 3;
        throw error;
      },
    }),
    (error) => {
      assert.equal(error.code, 'DETECTION_UNAVAILABLE');
      assert.equal(error.attempts[0].requestAttempts, 3);
      return true;
    }
  );
});

test('treats a partial detector run as incomplete', async () => {
  await assert.rejects(
    detectWithKnownEngines({
      buffer: Buffer.from('same-image'),
      filename: 'copy.jpg',
      knownImages: [
        { engine: 'qim-dct', width: 1200, height: 800 },
        { engine: 'trustmark', width: 1200, height: 800 },
      ],
      defaultEngine: 'qim-dct',
      detectImage: async (_buffer, _filename, engine) => {
        if (engine === 'qim-dct') return { marked: false, payload: null };
        throw new Error('advanced detector unavailable');
      },
    }),
    (error) => error.code === 'DETECTION_UNAVAILABLE'
  );
});
