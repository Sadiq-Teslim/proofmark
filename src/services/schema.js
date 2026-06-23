const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const addColumnIfMissing = async (queryInterface, tableName, columns, columnName, definition) => {
  if (columns[columnName]) return;
  await queryInterface.addColumn(tableName, columnName, definition);
  console.log(`Added missing column ${tableName}.${columnName}`);
};

const describeTable = async (queryInterface, tableName) => {
  try {
    return await queryInterface.describeTable(tableName);
  } catch (error) {
    if (/No description found|does not exist/i.test(error.message)) return null;
    throw error;
  }
};

const ensureSchemaCompatibility = async () => {
  const queryInterface = sequelize.getQueryInterface();

  const assets = await describeTable(queryInterface, 'assets');
  if (assets) {
    await addColumnIfMissing(queryInterface, 'assets', assets, 'type', {
      type: DataTypes.STRING,
      defaultValue: 'image',
    });
    await addColumnIfMissing(queryInterface, 'assets', assets, 'protectedUrl', {
      type: DataTypes.TEXT,
      defaultValue: '',
    });
    await addColumnIfMissing(queryInterface, 'assets', assets, 'protectedPublicId', {
      type: DataTypes.STRING,
      defaultValue: '',
    });
    await addColumnIfMissing(queryInterface, 'assets', assets, 'status', {
      type: DataTypes.STRING,
      defaultValue: 'processing',
    });
    await addColumnIfMissing(queryInterface, 'assets', assets, 'error', {
      type: DataTypes.TEXT,
      defaultValue: '',
    });
    await addColumnIfMissing(queryInterface, 'assets', assets, 'sourceFilename', {
      type: DataTypes.STRING,
      defaultValue: '',
    });
    await addColumnIfMissing(queryInterface, 'assets', assets, 'mimeType', {
      type: DataTypes.STRING,
      defaultValue: '',
    });
    await addColumnIfMissing(queryInterface, 'assets', assets, 'durationSeconds', {
      type: DataTypes.FLOAT,
      allowNull: true,
    });
    await addColumnIfMissing(queryInterface, 'assets', assets, 'fps', {
      type: DataTypes.FLOAT,
      allowNull: true,
    });
    await addColumnIfMissing(queryInterface, 'assets', assets, 'metadata', {
      type: DataTypes.JSONB,
      defaultValue: {},
    });
  }

  const images = await describeTable(queryInterface, 'images');
  if (images) {
    await addColumnIfMissing(queryInterface, 'images', images, 'originalPublicId', {
      type: DataTypes.STRING,
      defaultValue: '',
    });
    await addColumnIfMissing(queryInterface, 'images', images, 'watermarkedPublicId', {
      type: DataTypes.STRING,
      defaultValue: '',
    });
    await addColumnIfMissing(queryInterface, 'images', images, 'engine', {
      type: DataTypes.STRING,
      defaultValue: 'qim-dct',
    });
    await addColumnIfMissing(queryInterface, 'images', images, 'width', {
      type: DataTypes.INTEGER,
      allowNull: true,
    });
    await addColumnIfMissing(queryInterface, 'images', images, 'height', {
      type: DataTypes.INTEGER,
      allowNull: true,
    });
    await addColumnIfMissing(queryInterface, 'images', images, 'assetId', {
      type: DataTypes.UUID,
      allowNull: true,
    });
  }

  const sightings = await describeTable(queryInterface, 'sightings');
  if (sightings) {
    await addColumnIfMissing(queryInterface, 'sightings', sightings, 'imageUrl', {
      type: DataTypes.TEXT,
      defaultValue: '',
    });
    await addColumnIfMissing(queryInterface, 'sightings', sightings, 'mediaUrl', {
      type: DataTypes.TEXT,
      defaultValue: '',
    });
    await addColumnIfMissing(queryInterface, 'sightings', sightings, 'source', {
      type: DataTypes.STRING,
      defaultValue: '',
    });
    await addColumnIfMissing(queryInterface, 'sightings', sightings, 'confirmed', {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    });
    await addColumnIfMissing(queryInterface, 'sightings', sightings, 'payload', {
      type: DataTypes.INTEGER,
      allowNull: true,
    });
    await addColumnIfMissing(queryInterface, 'sightings', sightings, 'assetType', {
      type: DataTypes.STRING,
      defaultValue: 'image',
    });
    await addColumnIfMissing(queryInterface, 'sightings', sightings, 'assetId', {
      type: DataTypes.UUID,
      allowNull: true,
    });
    await addColumnIfMissing(queryInterface, 'sightings', sightings, 'metadata', {
      type: DataTypes.JSONB,
      defaultValue: {},
    });
  }

  const verifications = await describeTable(queryInterface, 'verifications');
  if (verifications) {
    await addColumnIfMissing(queryInterface, 'verifications', verifications, 'suspectUrl', {
      type: DataTypes.TEXT,
      defaultValue: '',
    });
    await addColumnIfMissing(queryInterface, 'verifications', verifications, 'suspectImageUrl', {
      type: DataTypes.TEXT,
      defaultValue: '',
    });
    await addColumnIfMissing(queryInterface, 'verifications', verifications, 'suspectMediaUrl', {
      type: DataTypes.TEXT,
      defaultValue: '',
    });
    await addColumnIfMissing(queryInterface, 'verifications', verifications, 'assetType', {
      type: DataTypes.STRING,
      defaultValue: 'image',
    });
    await addColumnIfMissing(queryInterface, 'verifications', verifications, 'source', {
      type: DataTypes.STRING,
      defaultValue: 'upload',
    });
    await addColumnIfMissing(queryInterface, 'verifications', verifications, 'evidence', {
      type: DataTypes.JSONB,
      defaultValue: {},
    });
    await addColumnIfMissing(queryInterface, 'verifications', verifications, 'assetId', {
      type: DataTypes.UUID,
      allowNull: true,
    });
  }

  const protectionJobs = await describeTable(queryInterface, 'protection_jobs');
  if (protectionJobs) {
    await addColumnIfMissing(queryInterface, 'protection_jobs', protectionJobs, 'durationSeconds', {
      type: DataTypes.FLOAT,
      allowNull: true,
    });
    await addColumnIfMissing(queryInterface, 'protection_jobs', protectionJobs, 'fps', {
      type: DataTypes.FLOAT,
      allowNull: true,
    });
    await addColumnIfMissing(queryInterface, 'protection_jobs', protectionJobs, 'assetId', {
      type: DataTypes.UUID,
      allowNull: true,
    });
    await addColumnIfMissing(queryInterface, 'protection_jobs', protectionJobs, 'assetType', {
      type: DataTypes.STRING,
      defaultValue: 'image',
    });
    await addColumnIfMissing(queryInterface, 'protection_jobs', protectionJobs, 'metadata', {
      type: DataTypes.JSONB,
      defaultValue: {},
    });
  }

  const verificationJobs = await describeTable(queryInterface, 'verification_jobs');
  if (verificationJobs) {
    await addColumnIfMissing(queryInterface, 'verification_jobs', verificationJobs, 'assetType', {
      type: DataTypes.STRING,
      defaultValue: 'video',
    });
    await addColumnIfMissing(queryInterface, 'verification_jobs', verificationJobs, 'suspectPublicId', {
      type: DataTypes.STRING,
      defaultValue: '',
    });
    await addColumnIfMissing(queryInterface, 'verification_jobs', verificationJobs, 'result', {
      type: DataTypes.STRING,
      defaultValue: '',
    });
    await addColumnIfMissing(queryInterface, 'verification_jobs', verificationJobs, 'detectedPayload', {
      type: DataTypes.INTEGER,
      allowNull: true,
    });
    await addColumnIfMissing(queryInterface, 'verification_jobs', verificationJobs, 'confidence', {
      type: DataTypes.FLOAT,
      allowNull: true,
    });
    await addColumnIfMissing(queryInterface, 'verification_jobs', verificationJobs, 'evidence', {
      type: DataTypes.JSONB,
      defaultValue: {},
    });
    await addColumnIfMissing(queryInterface, 'verification_jobs', verificationJobs, 'verificationId', {
      type: DataTypes.UUID,
      allowNull: true,
    });
    await addColumnIfMissing(queryInterface, 'verification_jobs', verificationJobs, 'assetId', {
      type: DataTypes.UUID,
      allowNull: true,
    });
  }
};

module.exports = { ensureSchemaCompatibility };
