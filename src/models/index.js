const sequelize = require('../config/db');
const User = require('./User');
const Image = require('./Image');
const Sighting = require('./Sighting');

User.hasMany(Image, { foreignKey: 'userId' });
Image.belongsTo(User, { foreignKey: 'userId', as: 'owner' });

Image.hasMany(Sighting, { foreignKey: 'imageId' });
Sighting.belongsTo(Image, { foreignKey: 'imageId', as: 'image' });
User.hasMany(Sighting, { foreignKey: 'userId' });
Sighting.belongsTo(User, { foreignKey: 'userId' });

module.exports = { sequelize, User, Image, Sighting };
