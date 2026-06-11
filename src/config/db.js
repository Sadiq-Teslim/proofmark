const { Sequelize } = require('sequelize');

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');

// Render (and most hosted Postgres) require SSL; local dev does not.
const isLocal = /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL);

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: isLocal ? {} : { ssl: { require: true, rejectUnauthorized: false } },
});

module.exports = sequelize;
