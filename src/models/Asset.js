const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Asset = sequelize.define('Asset', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  type: {
    type: DataTypes.ENUM('image', 'video'),
    allowNull: false,
  },
  title: { type: DataTypes.STRING, allowNull: false },
  originalUrl: { type: DataTypes.TEXT, allowNull: false },
  originalPublicId: { type: DataTypes.STRING, defaultValue: '' },
  protectedUrl: { type: DataTypes.TEXT, defaultValue: '' },
  protectedPublicId: { type: DataTypes.STRING, defaultValue: '' },
  payload: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  engine: { type: DataTypes.STRING, defaultValue: 'qim-dct' },
  status: {
    type: DataTypes.ENUM('processing', 'ready', 'error'),
    defaultValue: 'processing',
    allowNull: false,
  },
  error: { type: DataTypes.TEXT, defaultValue: '' },
  sourceFilename: { type: DataTypes.STRING, defaultValue: '' },
  mimeType: { type: DataTypes.STRING, defaultValue: '' },
  width: { type: DataTypes.INTEGER },
  height: { type: DataTypes.INTEGER },
  durationSeconds: { type: DataTypes.FLOAT },
  fps: { type: DataTypes.FLOAT },
  metadata: { type: DataTypes.JSONB, defaultValue: {} },
}, {
  tableName: 'assets',
  indexes: [
    { fields: ['userId', 'type', 'createdAt'] },
    { fields: ['payload'] },
    { fields: ['status'] },
  ],
});

module.exports = Asset;
