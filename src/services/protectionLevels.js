const PROTECTION_LEVELS = {
  'qim-dct': 'ProofMark Standard',
  trustmark: 'ProofMark Advanced',
  videoseal: 'ProofMark Advanced',
};

const protectionLevelName = (engine) => (
  PROTECTION_LEVELS[String(engine || '').toLowerCase()] || 'ProofMark Protection'
);

module.exports = { protectionLevelName };
