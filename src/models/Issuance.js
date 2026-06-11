const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// `payload` is the forensic id embedded by FPWM — globally unique for reverse lookup.
// 28-bit space fits in a Postgres INTEGER (max ~2.1B), so it serializes as a JS number.
const Issuance = sequelize.define('Issuance', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  payload: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  engine: { type: DataTypes.STRING, defaultValue: 'qim-dct' },
  watermarkedUrl: { type: DataTypes.TEXT, allowNull: false },
  watermarkedPublicId: { type: DataTypes.STRING, defaultValue: '' },
}, { tableName: 'issuances' });

module.exports = Issuance;
