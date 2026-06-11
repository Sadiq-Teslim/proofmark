const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// One watermarked image per upload, owned by the uploader.
// `payload` is the forensic id embedded by FPWM — globally unique for reverse lookup.
const Image = sequelize.define('Image', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  title: { type: DataTypes.STRING, allowNull: false },
  originalUrl: { type: DataTypes.TEXT, allowNull: false },
  originalPublicId: { type: DataTypes.STRING, defaultValue: '' },
  watermarkedUrl: { type: DataTypes.TEXT, allowNull: false },
  watermarkedPublicId: { type: DataTypes.STRING, defaultValue: '' },
  payload: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  engine: { type: DataTypes.STRING, defaultValue: 'qim-dct' },
}, { tableName: 'images' });

module.exports = Image;
