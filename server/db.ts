import mongoose from 'mongoose';
import { authManager } from './auth.js';
import { botManager } from './botManager.js';
import fs from 'fs';
import path from 'path';

// Support user-provided string for this specific context, while encouraging env vars for production
const fallbackUri = 'mongodb://mongo:gTCjfWKQvmbNoSgtPnoWHlxofIdVbCZn@mongodb.railway.internal:27017';
const MONGODB_URI = process.env.MONGODB_URI || fallbackUri;

let isConnected = false;

// Schemas
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

const SessionSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  userId: { type: String, required: true }
});

const BotSchema = new mongoose.Schema({
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
export const BotModel = mongoose.models.Bot || mongoose.model('Bot', BotSchema);

export async function connectDB() {
  if (isConnected) return;
  try {
    console.log('[MongoDB] Connecting to database...');
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log('[MongoDB] Successfully connected.');
    
    await syncFromDatabase();
    setupSyncHooks();
    
    // Auto-reconnect bots that should be running
    // @ts-ignore
    botManager.performHealthCheck();
  } catch (err: any) {
    console.warn('[MongoDB] Failed to connect.');
    console.warn('Note: If you are using a railway.internal URL, it is ONLY accessible from within Railway. The AI Studio preview cannot reach it. Falling back to local file storage.');
    console.warn(`[MongoDB] Error: ${err.message}`);
  }
}

async function syncFromDatabase() {
  console.log('[MongoDB] Syncing data to memory...');
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
      // DB is empty, migrate existing local users to DB
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
      // If MongoDB has bots, we prefer MongoDB.
      // Cleanly stop any existing bot instances loaded from JSON so we don't duplicate logic.
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
        // Re-register cleanly
        // @ts-ignore
        botManager.registerBot(bData);
      }
    } else {
      // Migrate local bots to DB
      // @ts-ignore
      const localBots = Array.from(botManager.bots.values()).map(b => b.config);
      if (localBots.length > 0) await BotModel.insertMany(localBots as any);
    }
  } catch (err) {
    console.error('[MongoDB] Sync failed:', err);
  }
}

function setupSyncHooks() {
  console.log('[MongoDB] Setting up background sync hooks...');
  
  // Monkey-patch AuthManager.saveUsers
  // @ts-ignore
  const origSaveUsers = authManager.saveUsers.bind(authManager);
  // @ts-ignore
  authManager.saveUsers = function() {
    origSaveUsers();
    (async () => {
      try {
        // @ts-ignore
        const currentUsers = Array.from(authManager.users.values());
        for (const u of currentUsers) {
          await UserModel.updateOne({ id: u.id }, u, { upsert: true });
        }
      } catch (err) { console.error('Mongo users sync err:', err); }
    })();
  };

  // Monkey-patch AuthManager.saveSessions
  // @ts-ignore
  const origSaveSessions = authManager.saveSessions.bind(authManager);
  // @ts-ignore
  authManager.saveSessions = function() {
    origSaveSessions();
    (async () => {
      try {
        // @ts-ignore
        const currentSessions = Array.from(authManager.sessions.entries());
        for (const [token, userId] of currentSessions) {
          await SessionModel.updateOne({ token }, { token, userId }, { upsert: true });
        }
      } catch (err) { console.error('Mongo sessions sync err:', err); }
    })();
  };

  // Monkey-patch AuthManager.deleteUser
  const origDeleteUser = authManager.deleteUser.bind(authManager);
  // @ts-ignore
  authManager.deleteUser = function(targetUserId) {
    const res = origDeleteUser(targetUserId);
    if (res) {
      (async () => {
        try {
          await UserModel.deleteOne({ id: targetUserId });
          await SessionModel.deleteMany({ userId: targetUserId });
        } catch (err) { console.error('Mongo deleteUser err:', err); }
      })();
    }
    return res;
  };

  // Monkey-patch BotManager.saveConfigs
  // @ts-ignore
  const origSaveConfigs = botManager.saveConfigs.bind(botManager);
  // @ts-ignore
  botManager.saveConfigs = function() {
    origSaveConfigs();
    (async () => {
      try {
        // @ts-ignore
        const currentConfigs = Array.from(botManager.bots.values()).map(b => b.config);
        for (const c of currentConfigs) {
          await BotModel.updateOne({ id: c.id }, c, { upsert: true });
        }
      } catch (err) { console.error('Mongo bot sync err:', err); }
    })();
  };

  // Override deleteBot
  const origDeleteBot = botManager.deleteBot.bind(botManager);
  // @ts-ignore
  botManager.deleteBot = function(userId, botId) {
    const res = origDeleteBot(botId, userId);
    if (res) {
      (async () => {
        try {
          await BotModel.deleteOne({ id: botId, userId });
        } catch (err) { console.error('Mongo deleteBot err:', err); }
      })();
    }
    return res;
  }
}
