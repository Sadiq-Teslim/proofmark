const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// Evidence record for every suspect image checked by a user.
const Verification = sequelize.define('Verification', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  suspectFilename: { type: DataTypes.STRING, defaultValue: '' },
  suspectUrl: { type: DataTypes.TEXT, defaultValue: '' },
  suspectImageUrl: { type: DataTypes.TEXT, defaultValue: '' },
  source: { type: DataTypes.STRING, defaultValue: 'upload' },
  result: {
    type: DataTypes.ENUM('matched', 'unknown_owner', 'not_found', 'invalid'),
    allowNull: false,
  },
  detectedPayload: { type: DataTypes.INTEGER },
  confidence: { type: DataTypes.FLOAT },
  engine: { type: DataTypes.STRING, defaultValue: '' },
  message: { type: DataTypes.TEXT, defaultValue: '' },
  evidence: { type: DataTypes.JSONB, defaultValue: {} },
}, {
  tableName: 'verifications',
});

module.exports = Verification;
