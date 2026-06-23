const sequelize = require('../config/db');
const User = require('./User');
const Asset = require('./Asset');
const Image = require('./Image');
const Sighting = require('./Sighting');
const Verification = require('./Verification');
const ProtectionJob = require('./ProtectionJob');
const VerificationJob = require('./VerificationJob');

User.hasMany(Asset, { foreignKey: 'userId' });
Asset.belongsTo(User, { foreignKey: 'userId', as: 'owner' });
User.hasMany(Image, { foreignKey: 'userId' });
Image.belongsTo(User, { foreignKey: 'userId', as: 'owner' });
Asset.hasOne(Image, { foreignKey: 'assetId' });
Image.belongsTo(Asset, { foreignKey: 'assetId', as: 'asset' });
User.hasMany(ProtectionJob, { foreignKey: 'userId' });
ProtectionJob.belongsTo(User, { foreignKey: 'userId', as: 'owner' });
Image.hasOne(ProtectionJob, { foreignKey: 'imageId' });
ProtectionJob.belongsTo(Image, { foreignKey: 'imageId', as: 'image' });
Asset.hasOne(ProtectionJob, { foreignKey: 'assetId' });
ProtectionJob.belongsTo(Asset, { foreignKey: 'assetId', as: 'asset' });

Image.hasMany(Sighting, { foreignKey: 'imageId' });
Sighting.belongsTo(Image, { foreignKey: 'imageId', as: 'image' });
Asset.hasMany(Sighting, { foreignKey: 'assetId' });
Sighting.belongsTo(Asset, { foreignKey: 'assetId', as: 'asset' });
User.hasMany(Sighting, { foreignKey: 'userId' });
Sighting.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Verification, { foreignKey: 'userId' });
Verification.belongsTo(User, { foreignKey: 'userId' });
Image.hasMany(Verification, { foreignKey: 'imageId' });
Verification.belongsTo(Image, { foreignKey: 'imageId', as: 'image' });
Asset.hasMany(Verification, { foreignKey: 'assetId' });
Verification.belongsTo(Asset, { foreignKey: 'assetId', as: 'asset' });
User.hasMany(VerificationJob, { foreignKey: 'userId' });
VerificationJob.belongsTo(User, { foreignKey: 'userId' });
Asset.hasMany(VerificationJob, { foreignKey: 'assetId' });
VerificationJob.belongsTo(Asset, { foreignKey: 'assetId', as: 'asset' });
Verification.hasOne(VerificationJob, { foreignKey: 'verificationId' });
VerificationJob.belongsTo(Verification, { foreignKey: 'verificationId', as: 'verification' });

module.exports = {
  sequelize,
  User,
  Asset,
  Image,
  Sighting,
  Verification,
  ProtectionJob,
  VerificationJob,
};
