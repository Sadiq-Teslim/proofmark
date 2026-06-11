const sequelize = require('../config/db');
const User = require('./User');
const Asset = require('./Asset');
const Recipient = require('./Recipient');
const Issuance = require('./Issuance');

// Ownership
User.hasMany(Asset, { foreignKey: 'userId' });
Asset.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Recipient, { foreignKey: 'userId' });
Recipient.belongsTo(User, { foreignKey: 'userId' });

// Issuances link an asset + recipient to an owner (aliases match the API/UI shape).
User.hasMany(Issuance, { foreignKey: 'userId' });
Issuance.belongsTo(User, { foreignKey: 'userId', as: 'owner' });
Asset.hasMany(Issuance, { foreignKey: 'assetId' });
Issuance.belongsTo(Asset, { foreignKey: 'assetId', as: 'asset' });
Recipient.hasMany(Issuance, { foreignKey: 'recipientId' });
Issuance.belongsTo(Recipient, { foreignKey: 'recipientId', as: 'recipient' });

module.exports = { sequelize, User, Asset, Recipient, Issuance };
