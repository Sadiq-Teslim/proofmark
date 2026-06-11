const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Asset = sequelize.define('Asset', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  title: { type: DataTypes.STRING, allowNull: false },
  originalUrl: { type: DataTypes.TEXT, allowNull: false },
  originalPublicId: { type: DataTypes.STRING, defaultValue: '' },
  mimeType: { type: DataTypes.STRING, defaultValue: 'image/png' },
}, { tableName: 'assets' });

module.exports = Asset;
