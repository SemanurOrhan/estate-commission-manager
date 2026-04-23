/**
 * reset-db.js
 * Connects to MongoDB via Mongoose and clears all data from
 * the transactions, agents, and properties collections.
 *
 * Usage:  node reset-db.js
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Parse .env manually to avoid a dotenv dependency
const envPath = path.resolve(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
for (const line of envContent.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const idx = trimmed.indexOf('=');
  if (idx === -1) continue;
  envVars[trimmed.slice(0, idx)] = trimmed.slice(idx + 1);
}

const MONGO_URI = envVars.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌  MONGO_URI is not defined in .env');
  process.exit(1);
}

async function resetDatabase() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB.');

    const db = mongoose.connection.db;
    const collections = ['transactions', 'agents', 'properties'];

    for (const name of collections) {
      const result = await db.collection(name).deleteMany({});
      console.log(`  ✔ Cleared "${name}" — ${result.deletedCount} document(s) removed.`);
    }

    console.log('\n✅  Database successfully reset for clean demo.');
  } catch (err) {
    console.error('❌  Failed to reset database:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

resetDatabase();
