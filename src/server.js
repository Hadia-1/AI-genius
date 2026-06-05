// =============================================================
//  src/server.js  –  Entry Point
// =============================================================

require('dotenv').config();

const app = require('./app');
const { initDB } = require('./models/db');

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Seed the mock database (hashes passwords at startup)
    await initDB();

    app.listen(PORT, () => {
      console.log(`\n🚀  AI-Genius server running on http://localhost:${PORT}`);
      console.log(`🌍  Environment : ${process.env.NODE_ENV}`);
      console.log(`📋  API Docs   : http://localhost:${PORT}/\n`);
    });
  } catch (err) {
    console.error('❌  Failed to start server:', err.message);
    process.exit(1);
  }
}

startServer();
