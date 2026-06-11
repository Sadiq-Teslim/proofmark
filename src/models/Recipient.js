const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Recipient = sequelize.define('Recipient', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, defaultValue: '' },
  label: { type: DataTypes.STRING, defaultValue: '' },
}, { tableName: 'recipients' });

module.exports = Recipient;
