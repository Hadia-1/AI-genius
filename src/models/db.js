// =============================================================
//  src/models/db.js  –  Mock In-Memory Database
//  In production, replace this module with your real ORM/ODM
//  (Mongoose, Prisma, Sequelize, etc.)
// =============================================================

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// -----------------------------------------------------------------
//  Seed users  (passwords are hashed at startup – see initDB())
// -----------------------------------------------------------------
const SEED_USERS = [
  {
    email: 'admin@aigenius.com',
    plainPassword: 'Admin@1234',
    role: 'Admin',
  },
  {
    email: 'premium@aigenius.com',
    plainPassword: 'Premium@1234',
    role: 'Premium_User',
  },
  {
    email: 'free@aigenius.com',
    plainPassword: 'Free@1234',
    role: 'Free_User',
  },
];

// Runtime stores
const users = [];           // { id, email, password (hashed), role }
const refreshTokens = [];   // whitelist: { token, userId, expiresAt }

// -----------------------------------------------------------------
//  Bootstrap: hash passwords once on server start
// -----------------------------------------------------------------
async function initDB() {
  for (const seed of SEED_USERS) {
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(seed.plainPassword, salt);
    users.push({
      id: uuidv4(),
      email: seed.email,
      password: hashedPassword,   // stored hash – never plaintext
      role: seed.role,
    });
  }
  console.log('✅  Mock DB seeded with', users.length, 'users');
}

// -----------------------------------------------------------------
//  User helpers
// -----------------------------------------------------------------
function findUserByEmail(email) {
  return users.find((u) => u.email === email) || null;
}

function findUserById(id) {
  return users.find((u) => u.id === id) || null;
}

// -----------------------------------------------------------------
//  Refresh-token whitelist helpers
// -----------------------------------------------------------------
function saveRefreshToken(token, userId, expiresAt) {
  // Remove any existing token for this user (one session per user)
  removeRefreshTokenByUserId(userId);
  refreshTokens.push({ token, userId, expiresAt });
}

function findRefreshToken(token) {
  return refreshTokens.find((t) => t.token === token) || null;
}

function removeRefreshToken(token) {
  const idx = refreshTokens.findIndex((t) => t.token === token);
  if (idx !== -1) refreshTokens.splice(idx, 1);
}

function removeRefreshTokenByUserId(userId) {
  const idx = refreshTokens.findIndex((t) => t.userId === userId);
  if (idx !== -1) refreshTokens.splice(idx, 1);
}

module.exports = {
  initDB,
  findUserByEmail,
  findUserById,
  saveRefreshToken,
  findRefreshToken,
  removeRefreshToken,
  removeRefreshTokenByUserId,
};
