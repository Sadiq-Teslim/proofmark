const assert = require('node:assert/strict');
const test = require('node:test');

const { protectionLevelName } = require('../src/services/protectionLevels');

test('uses product names for internal protection engines', () => {
  assert.equal(protectionLevelName('qim-dct'), 'ProofMark Standard');
  assert.equal(protectionLevelName('trustmark'), 'ProofMark Advanced');
  assert.equal(protectionLevelName('videoseal'), 'ProofMark Advanced');
});

test('does not expose unknown engine identifiers', () => {
  assert.equal(protectionLevelName('future-engine'), 'ProofMark Protection');
  assert.equal(protectionLevelName(), 'ProofMark Protection');
});
