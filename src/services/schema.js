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
  }

  const sightings = await describeTable(queryInterface, 'sightings');
  if (sightings) {
    await addColumnIfMissing(queryInterface, 'sightings', sightings, 'imageUrl', {
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
    await addColumnIfMissing(queryInterface, 'verifications', verifications, 'source', {
      type: DataTypes.STRING,
      defaultValue: 'upload',
    });
    await addColumnIfMissing(queryInterface, 'verifications', verifications, 'evidence', {
      type: DataTypes.JSONB,
      defaultValue: {},
    });
  }
};

module.exports = { ensureSchemaCompatibility };
