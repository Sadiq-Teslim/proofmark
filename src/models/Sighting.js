const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// A place on the web where a copy of a protected image/video was found by the tracker.
const Sighting = sequelize.define('Sighting', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  pageUrl: { type: DataTypes.TEXT, allowNull: false },   // where the copy appears
  imageUrl: { type: DataTypes.TEXT, defaultValue: '' },  // direct URL of the copy
  mediaUrl: { type: DataTypes.TEXT, defaultValue: '' },  // direct URL for generic/video assets
  source: { type: DataTypes.STRING, defaultValue: '' },  // search provider / 'manual'
  confirmed: { type: DataTypes.BOOLEAN, defaultValue: false }, // watermark verified on it
  payload: { type: DataTypes.INTEGER },
  assetType: { type: DataTypes.STRING, defaultValue: 'image' },
  assetId: { type: DataTypes.UUID },
  metadata: { type: DataTypes.JSONB, defaultValue: {} },
}, {
  tableName: 'sightings',
  indexes: [
    { unique: true, fields: ['imageId', 'pageUrl'] },
    { fields: ['assetId', 'pageUrl'] },
    { fields: ['userId', 'assetType', 'createdAt'] },
  ],
});

module.exports = Sighting;
