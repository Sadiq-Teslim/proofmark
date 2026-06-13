const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ProtectionJob = sequelize.define('ProtectionJob', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  title: { type: DataTypes.STRING, allowNull: false },
  originalUrl: { type: DataTypes.TEXT, allowNull: false },
  originalPublicId: { type: DataTypes.STRING, defaultValue: '' },
  sourceFilename: { type: DataTypes.STRING, defaultValue: '' },
  payload: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  engine: { type: DataTypes.STRING, defaultValue: 'trustmark' },
  fpwmJobId: { type: DataTypes.STRING, allowNull: false },
  status: {
    type: DataTypes.ENUM('processing', 'ready', 'error'),
    defaultValue: 'processing',
    allowNull: false,
  },
  error: { type: DataTypes.TEXT, defaultValue: '' },
  watermarkedUrl: { type: DataTypes.TEXT, defaultValue: '' },
  watermarkedPublicId: { type: DataTypes.STRING, defaultValue: '' },
  width: { type: DataTypes.INTEGER },
  height: { type: DataTypes.INTEGER },
  imageId: { type: DataTypes.UUID },
}, {
  tableName: 'protection_jobs',
});

module.exports = ProtectionJob;
