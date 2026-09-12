import mongoose from 'mongoose';
import { authManager } from './auth.js';
import { botManager } from './botManager.js';

// Primary database URI from Railway environment or fallback
const fallbackUri = 'mongodb://mongo:JzjarpNbvBWkKKlJcZTYRPkKHUwtawsf@mongodb.railway.internal:27017';
const MONGO_URL = process.env.MONGO_URL || process.env.MONGODB_URI || fallbackUri;

let isConnected = false;

// Register Mongoose Connection Lifecycle Event Listeners
mongoose.connection.on('connected', () => {
  isConnected = true;
  console.log('[MongoDB] ✅ Connected successfully to MongoDB / Railway database!');
});

mongoose.connection.on('error', (err) => {
  if (!isConnected) return; // Suppress verbose reconnect errors when offline
  console.error('[MongoDB] ❌ Runtime Database Error:', err?.message || err);
});

mongoose.connection.on('disconnected', () => {
  if (isConnected) {
    console.warn('[MongoDB] ⚠️ Disconnected from database. Reverting to local fallback mode.');
    isConnected = false;
  }
});

// 1. User Schema & Model (username, password hash, profiles)
const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  passwordHash: { type: String },
  salt: { type: String },
  plainPassword: { type: String },
  email: { type: String },
  normalizedEmail: { type: String },
  isAdmin: { type: Boolean, default: false },
  isTester: { type: Boolean, default: false },
  registrationIp: { type: String },
  deviceFingerprint: { type: String },
  createdAt: { type: Number, required: true }
}, { strict: false });

// 2. Session Schema & Model
const SessionSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  userId: { type: String, required: true }
});

// 3. BotConfig Schema & Model (bot settings, server IP, plugin toggles)
const BotConfigSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  name: { type: String, required: true },
  username: { type: String, required: true },
  host: { type: String, required: true },
  port: { type: Number, required: true },
  version: { type: String, required: true },
  authType: { type: String, default: 'offline' },
  plugins: { type: [String], default: [] },
  onJoinCommand: { type: String, default: '' },
  shouldRun: { type: Boolean, default: false }
}, { strict: false });

export const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);
export const SessionModel = mongoose.models.Session || mongoose.model('Session', SessionSchema);
export const BotModel = mongoose.models.Bot || mongoose.model('Bot', BotConfigSchema);

/**
 * Connects to MongoDB with family: 0 option for Railway IPv6/IPv4 dual-stack DNS resolution.
 */
export async function connectDB() {
  if (isConnected) return;
  try {
    console.log('[MongoDB] 🔄 Connecting to MongoDB database...');
    
    await mongoose.connect(MONGO_URL, {
      family: 0, // Enable dual IPv4 & IPv6 stack resolution to resolve Railway internal DNS (.railway.internal)
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000,
    });

    isConnected = true;
    
    // Sync memory state with database
    await syncFromDatabase();
    setupSyncHooks();
    
    // Perform health check on active bots
    // @ts-ignore
    botManager.performHealthCheck();
  } catch (err: any) {
    isConnected = false;
    await mongoose.disconnect().catch(() => {});
    console.error('[MongoDB] ❌ Connection failed:', err?.message || err);
    console.warn('[MongoDB] ℹ️ Operating safely in local file persistence mode.');
  }
}

/**
 * Hydrates in-memory auth and bot state from MongoDB
 */
async function syncFromDatabase() {
  console.log('[MongoDB] 📥 Syncing data to memory...');
  try {
    // 1. Sync Users
    const dbUsers = await UserModel.find().lean();
    if (dbUsers.length > 0) {
      // @ts-ignore
      authManager.users.clear();
      for (const u of dbUsers) {
        // @ts-ignore
        u._id = undefined;
        // @ts-ignore
        u.__v = undefined;
        // @ts-ignore
        authManager.users.set(u.id, u);
      }
    } else {
      // Seed database from local memory if empty
      // @ts-ignore
      const localUsers = Array.from(authManager.users.values());
      if (localUsers.length > 0) await UserModel.insertMany(localUsers as any);
    }

    // 2. Sync Sessions
    const dbSessions = await SessionModel.find().lean();
    if (dbSessions.length > 0) {
      // @ts-ignore
      authManager.sessions.clear();
      for (const s of dbSessions) {
        // @ts-ignore
        authManager.sessions.set(s.token, s.userId);
      }
    } else {
      // @ts-ignore
      const localSessions = Array.from(authManager.sessions.entries()).map(([token, userId]) => ({ token, userId }));
      if (localSessions.length > 0) await SessionModel.insertMany(localSessions);
    }

    // 3. Sync Bots
    const dbBots = await BotModel.find().lean();
    if (dbBots.length > 0) {
      // @ts-ignore
      for (const bot of botManager.bots.values()) {
        bot.stop();
      }
      // @ts-ignore
      botManager.bots.clear();
      
      for (const bData of dbBots) {
        // @ts-ignore
        bData._id = undefined;
        // @ts-ignore
        bData.__v = undefined;
        // @ts-ignore
        botManager.registerBot(bData);
      }
    } else {
      // @ts-ignore
      const localBots = Array.from(botManager.bots.values()).map(b => b.config);
      if (localBots.length > 0) await BotModel.insertMany(localBots as any);
    }
  } catch (err) {
    console.error('[MongoDB] ❌ Sync failed:', err);
  }
}

/**
 * Registers real-time persistence hooks to sync changes back to MongoDB
 */
function setupSyncHooks() {
  console.log('[MongoDB] ⚡ Setting up persistence sync hooks...');
  
  // Auth Sync
  // @ts-ignore
  const origSaveUsers = authManager.saveUsers.bind(authManager);
  // @ts-ignore
  authManager.saveUsers = function() {
    origSaveUsers();
    if (!isConnected) return;
    (async () => {
      try {
        // @ts-ignore
        const currentUsers = Array.from(authManager.users.values());
        for (const u of currentUsers) {
          await UserModel.updateOne({ id: u.id }, u, { upsert: true });
        }
      } catch (err) { console.error('[MongoDB] User sync err:', err); }
    })();
  };

  // Session Sync
  // @ts-ignore
  const origSaveSessions = authManager.saveSessions.bind(authManager);
  // @ts-ignore
  authManager.saveSessions = function() {
    origSaveSessions();
    if (!isConnected) return;
    (async () => {
      try {
        // @ts-ignore
        const currentSessions = Array.from(authManager.sessions.entries());
        for (const [token, userId] of currentSessions) {
          await SessionModel.updateOne({ token }, { token, userId }, { upsert: true });
        }
      } catch (err) { console.error('[MongoDB] Session sync err:', err); }
    })();
  };

  // User Deletion Sync
  const origDeleteUser = authManager.deleteUser.bind(authManager);
  // @ts-ignore
  authManager.deleteUser = function(targetUserId) {
    const res = origDeleteUser(targetUserId);
    if (res && isConnected) {
      (async () => {
        try {
          await UserModel.deleteOne({ id: targetUserId });
          await SessionModel.deleteMany({ userId: targetUserId });
        } catch (err) { console.error('[MongoDB] Delete user err:', err); }
      })();
    }
    return res;
  };

  // Bot Config Sync
  // @ts-ignore
  const origSaveConfigs = botManager.saveConfigs.bind(authManager);
  // @ts-ignore
  botManager.saveConfigs = function() {
    origSaveConfigs();
    if (!isConnected) return;
    (async () => {
      try {
        // @ts-ignore
        const currentConfigs = Array.from(botManager.bots.values()).map(b => b.config);
        for (const c of currentConfigs) {
          await BotModel.updateOne({ id: c.id }, c, { upsert: true });
        }
      } catch (err) { console.error('[MongoDB] Bot config sync err:', err); }
    })();
  };

  // Bot Deletion Sync
  const origDeleteBot = botManager.deleteBot.bind(botManager);
  // @ts-ignore
  botManager.deleteBot = function(userId, botId) {
    const res = origDeleteBot(botId, userId);
    if (res && isConnected) {
      (async () => {
        try {
          await BotModel.deleteOne({ id: botId, userId });
        } catch (err) { console.error('[MongoDB] Delete bot err:', err); }
      })();
    }
    return res;
  };
}
