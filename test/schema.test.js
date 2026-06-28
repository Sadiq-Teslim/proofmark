const assert = require('node:assert/strict');
const test = require('node:test');

process.env.DATABASE_URL ||= 'postgres://test:test@localhost:5432/proofmark_test';

const sequelize = require('../src/config/db');
const { ensureSchemaCompatibility, withSchemaLock } = require('../src/services/schema');

test('adds assets.type before Sequelize sync can create its index', async (t) => {
  const originalGetQueryInterface = sequelize.getQueryInterface;
  const addedColumns = [];
  const existingAssetColumns = {
    userId: {},
    title: {},
    originalUrl: {},
    originalPublicId: {},
    protectedUrl: {},
    protectedPublicId: {},
    engine: {},
    status: {},
    error: {},
    sourceFilename: {},
    mimeType: {},
    width: {},
    height: {},
    durationSeconds: {},
    fps: {},
    metadata: {},
    createdAt: {},
    updatedAt: {},
  };

  sequelize.getQueryInterface = () => ({
    describeTable: async (tableName) => (tableName === 'assets' ? existingAssetColumns : null),
    addColumn: async (tableName, columnName) => {
      addedColumns.push(`${tableName}.${columnName}`);
    },
  });
  t.after(() => {
    sequelize.getQueryInterface = originalGetQueryInterface;
  });

  await ensureSchemaCompatibility();

  assert.deepEqual(addedColumns, ['assets.type', 'assets.payload']);
});

test('holds and releases the schema lock on the same connection', async (t) => {
  const manager = sequelize.connectionManager;
  const originalGetConnection = manager.getConnection;
  const originalReleaseConnection = manager.releaseConnection;
  const events = [];
  const connection = {
    query: async (sql) => {
      events.push(sql.includes('unlock') ? 'unlock' : 'lock');
    },
  };

  manager.getConnection = async () => connection;
  manager.releaseConnection = async (releasedConnection) => {
    assert.equal(releasedConnection, connection);
    events.push('release');
  };
  t.after(() => {
    manager.getConnection = originalGetConnection;
    manager.releaseConnection = originalReleaseConnection;
  });

  await withSchemaLock(async () => {
    events.push('callback');
  });

  assert.deepEqual(events, ['lock', 'callback', 'unlock', 'release']);
});
