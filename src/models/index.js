const sequelize = require('../config/db');
const User = require('./User');
const Image = require('./Image');
const Sighting = require('./Sighting');
const Verification = require('./Verification');

User.hasMany(Image, { foreignKey: 'userId' });
Image.belongsTo(User, { foreignKey: 'userId', as: 'owner' });

Image.hasMany(Sighting, { foreignKey: 'imageId' });
Sighting.belongsTo(Image, { foreignKey: 'imageId', as: 'image' });
User.hasMany(Sighting, { foreignKey: 'userId' });
Sighting.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Verification, { foreignKey: 'userId' });
Verification.belongsTo(User, { foreignKey: 'userId' });
Image.hasMany(Verification, { foreignKey: 'imageId' });
Verification.belongsTo(Image, { foreignKey: 'imageId', as: 'image' });

module.exports = { sequelize, User, Image, Sighting, Verification };
