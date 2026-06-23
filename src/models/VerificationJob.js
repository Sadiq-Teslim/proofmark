const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const VerificationJob = sequelize.define('VerificationJob', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  assetType: { type: DataTypes.STRING, defaultValue: 'video' },
  source: { type: DataTypes.STRING, defaultValue: 'upload' },
  suspectFilename: { type: DataTypes.STRING, defaultValue: '' },
  suspectUrl: { type: DataTypes.TEXT, defaultValue: '' },
  suspectPublicId: { type: DataTypes.STRING, defaultValue: '' },
  engine: { type: DataTypes.STRING, defaultValue: 'qim-dct' },
  fpwmJobId: { type: DataTypes.STRING, allowNull: false },
  status: {
    type: DataTypes.ENUM('processing', 'ready', 'error'),
    defaultValue: 'processing',
    allowNull: false,
  },
  result: { type: DataTypes.STRING, defaultValue: '' },
  detectedPayload: { type: DataTypes.INTEGER },
  confidence: { type: DataTypes.FLOAT },
  error: { type: DataTypes.TEXT, defaultValue: '' },
  evidence: { type: DataTypes.JSONB, defaultValue: {} },
  verificationId: { type: DataTypes.UUID },
  assetId: { type: DataTypes.UUID },
}, {
  tableName: 'verification_jobs',
  indexes: [
    { fields: ['userId', 'assetType', 'createdAt'] },
    { fields: ['status'] },
    { fields: ['fpwmJobId'] },
  ],
});

module.exports = VerificationJob;
