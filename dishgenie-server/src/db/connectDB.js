const mongoose = require('mongoose');

function dbNameFromUri(uri) {
  try {
    const path = new URL(uri).pathname.replace(/^\//, '');
    return path || 'dishgenie';
  } catch {
    return 'dishgenie';
  }
}

async function connectDB(uri) {
  if (!uri) {
    throw new Error('MONGO_URL is missing. Set it in your .env file.');
  }
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, { dbName: dbNameFromUri(uri) });
  console.log('✅ MongoDB connected');
}

module.exports = connectDB;
