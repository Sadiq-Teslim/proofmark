const assert = require('node:assert/strict');
const test = require('node:test');

const { isTransientDetectionError } = require('../src/services/fpwmClient');

test('retries network, rate-limit, and server detection failures', () => {
  assert.equal(isTransientDetectionError({ code: 'ECONNRESET' }), true);
  assert.equal(isTransientDetectionError({ response: { status: 429 } }), true);
  assert.equal(isTransientDetectionError({ response: { status: 503 } }), true);
  assert.equal(isTransientDetectionError({ response: { status: 400 } }), false);
  assert.equal(isTransientDetectionError({ code: 'FPWM_CONFIG_MISSING' }), false);
});
