const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// A place on the web where a copy of a watermarked image was found by the tracker.
const Sighting = sequelize.define('Sighting', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  pageUrl: { type: DataTypes.TEXT, allowNull: false },   // where the copy appears
  imageUrl: { type: DataTypes.TEXT, defaultValue: '' },  // direct URL of the copy
  source: { type: DataTypes.STRING, defaultValue: '' },  // search provider / 'manual'
  confirmed: { type: DataTypes.BOOLEAN, defaultValue: false }, // watermark verified on it
  payload: { type: DataTypes.INTEGER },
}, {
  tableName: 'sightings',
  indexes: [{ unique: true, fields: ['imageId', 'pageUrl'] }],
});

module.exports = Sighting;
