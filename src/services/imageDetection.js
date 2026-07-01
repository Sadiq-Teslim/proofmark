const fpwm = require('./fpwmClient');

class DetectionUnavailableError extends Error {
  constructor(attempts) {
    super('Verification temporarily unavailable. The saved image was not classified as unmarked.');
    this.name = 'DetectionUnavailableError';
    this.code = 'DETECTION_UNAVAILABLE';
    this.attempts = attempts;
  }
}

const unique = (items) => [...new Set(items.filter(Boolean))];

const candidateSizesFor = (knownImages) => unique(
  knownImages
    .filter((image) => image.width && image.height)
    .map((image) => `${image.width}x${image.height}`)
).map((size) => size.split('x').map(Number));

const detectWithKnownEngines = async ({
  buffer,
  filename,
  knownImages,
  requestedEngine,
  detectImage = fpwm.detectImage,
  defaultEngine = fpwm.defaultEngine(),
}) => {
  const candidateSizes = candidateSizesFor(knownImages);
  const engines = requestedEngine
    ? [requestedEngine]
    : unique([...knownImages.map((image) => image.engine), defaultEngine]);
  const attempts = [];

  for (const engine of engines) {
    try {
      // Every retry receives the same in-memory bytes and size hints.
      const detected = await detectImage(buffer, filename, engine, candidateSizes);
      attempts.push({
        engine,
        status: 'completed',
        requestAttempts: detected.requestAttempts || 1,
        marked: Boolean(detected.marked),
      });
      if (detected.marked && detected.payload) {
        return { ...detected, verificationAttempts: attempts };
      }
    } catch (error) {
      attempts.push({
        engine,
        status: 'unavailable',
        requestAttempts: error.detectionAttempts || 1,
        error: error.response?.data?.detail || error.message,
      });
    }
  }

  // A negative is authoritative only when every relevant detector completed.
  if (attempts.some((attempt) => attempt.status !== 'completed')) {
    throw new DetectionUnavailableError(attempts);
  }

  return {
    marked: false,
    payload: null,
    confidence: 0,
    engine: engines[0] || defaultEngine,
    verificationAttempts: attempts,
  };
};

module.exports = {
  DetectionUnavailableError,
  candidateSizesFor,
  detectWithKnownEngines,
};
