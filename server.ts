import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import http from 'http';
import path from 'path';
import fs from 'fs';
import net from 'net';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { botManager } from './server/botManager.js';
import { authManager } from './server/auth.js';

// Lazy Gemini client initialization
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

// Helper for offline knowledge answers if all remote Gemini models are temporarily experiencing high demand
function getKnowledgeBaseFallback(query: string): string {
  const q = query.toLowerCase();
  if (q.includes('aternos') || q.includes('24/7') || q.includes('keep alive') || q.includes('sleep')) {
    return `**Ninimo AI Assistant (Aternos 24/7 Guide)**\n\nAternos automatically turns off servers when empty. To keep it 24/7 online:\n\n1. **Cracked Mode**: In your Aternos options, toggle **Cracked: ON** (required for offline bots).\n2. **Anti-AFK**: In Ninimo Bot Settings, enable **Anti-AFK** and set action to **Strafe & Rotate** every 20-30s. This prevents Aternos from kicking the bot for idling.\n3. **Auto-Reconnect**: Ninimo will automatically reconnect if Aternos restarts or drops the socket.\n4. **On-Join Auth**: If your server uses AuthMe or LoginSecurity, add \`/login <password>\` in the On-Join Command field.`;
  }
  if (q.includes('login') || q.includes('register') || q.includes('password') || q.includes('auth')) {
    return `**Ninimo AI Assistant (Auto-Login Setup)**\n\nTo auto-authenticate your bot on cracked or hub servers:\n\n- Open **Edit Bot Settings**\n- Find the **On-Join Command** field\n- Enter \`/login yourpassword\` (or \`/register yourpassword yourpassword\` if registering for the first time)\n- When the bot joins, Ninimo automatically waits 1.5 seconds and executes the command in chat.`;
  }
  if (q.includes('tester') || q.includes('swarm') || q.includes('fleet') || q.includes('multi')) {
    return `**Ninimo AI Assistant (Multi-Bot Swarm)**\n\nThe \`TESTER\` account has fleet permissions:\n\n- Log into Ninimo with account \`TESTER\`\n- Use the **Swarm Bot Fleet** action to launch up to 8 bots simultaneously with sequential tags (\`Ninimo1\`, \`Ninimo2\`, etc.)\n- Great for testing server queue mechanics, faction chunk claiming, and proxy stress tests.`;
  }
  if (q.includes('disconnect') || q.includes('timeout') || q.includes('kick') || q.includes('error')) {
    return `**Ninimo AI Assistant (Troubleshooting Disconnects)**\n\nCommon reasons bots get kicked:\n\n- **Not Authenticated**: Server is in Online Mode (premium Mojang only). Set server to **Cracked** or use Microsoft auth.\n- **AFK Kick**: Server kicked the bot after 5-10 minutes. Turn on Ninimo's **Anti-AFK Strafe/Look**.\n- **Spam Kick**: Ensure On-Join commands don't loop too fast.\n- **Port/IP Mismatch**: On Aternos/Minehut, use the dynamic IP (e.g. \`node-1.aternos.me:12345\`) rather than the subdomain.`;
  }
  return `**Ninimo AI Assistant**\n\nI can help you configure your Minecraft bots, set up 24/7 uptime on free hosts (Aternos, Minehut, FalixNodes), configure anti-AFK patterns, and troubleshoot connection errors!\n\n*Tip: Ask me specifically about "Aternos 24/7 setup", "Auto login commands", or "Anti-AFK strafing".*`;
}

async function handleGeminiChat(
  userMessage: string,
  history: Array<{ role: 'user' | 'model'; text: string }>
): Promise<string> {
  const client = getGeminiClient();
  const systemInstruction = `You are Ninimo AI, an expert Minecraft Bot & 24/7 Server Assistant integrated into the Ninimo 24/7 Bot Commander platform.
Your specialties:
- Minecraft servers (Vanilla, Spigot, Paper, Purpur, Velocity, BungeeCord, Fabric, Forge)
- Mineflayer bot mechanics, AFK scripts, anti-AFK patterns (strafe, rotate look, jump)
- Free hosting 24/7 setups (Aternos, Minehut, FalixNodes, Server.pro)
- In-game authentication commands (/login, /register, /auth, /hub, /queue)
- Network errors (timeouts, disconnects, cracked vs online mode, protocol mismatches)
- Multi-bot swarming (using the TESTER account for server fleet operations and stress testing)
Give concise, helpful, friendly, and well-formatted answers with markdown code blocks and bullet points.`;

  if (!client) {
    return getKnowledgeBaseFallback(userMessage);
  }

  const contents: any[] = [];
  if (Array.isArray(history)) {
    for (const item of history.slice(-6)) {
      contents.push({
        role: item.role === 'model' ? 'model' : 'user',
        parts: [{ text: item.text }],
      });
    }
  }
  contents.push({
    role: 'user',
    parts: [{ text: userMessage }],
  });

  // Candidate models: try fast 3.8 flash first, cascade to 3.1 flash lite or flash latest if 503/high-demand occurs
  const candidateModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
  let lastError: any = null;

  for (const modelName of candidateModels) {
    try {
      const response = await client.models.generateContent({
        model: modelName,
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      if (response.text) {
        return response.text;
      }
    } catch (err: any) {
      lastError = err;
      const errMsg = err?.message || String(err);
      console.warn(`[GEMINI] Model ${modelName} encountered: ${errMsg}. Attempting fallback...`);
      // If error is high demand (503), rate limit (429), or unavailable, continue to next candidate model
      const isTemporary = errMsg.includes('503') || errMsg.includes('UNAVAILABLE') || errMsg.includes('high demand') || errMsg.includes('429');
      if (!isTemporary && !errMsg.includes('not found')) {
        // Continue trying alternative models
      }
    }
  }

  console.error('[GEMINI ALL MODELS FAILED]:', lastError);
  // Graceful fallback to knowledge base if all remote Gemini models are temporarily under peak demand
  return getKnowledgeBaseFallback(userMessage);
}

// Prevent any unhandled network errors (DNS lookup failures, broken pipes, timeouts) from crashing the server
process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION GUARD]:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[UNHANDLED REJECTION GUARD]:', reason);
});

async function startServer() {
  const app = express();
  const server = http.createServer(app);

  // Port resolution: AI Studio sandbox routes strictly to port 3000 via internal proxy.
  // On Railway or standard production hosts, listen dynamically on the assigned process.env.PORT.
  const isAiStudioSandbox = Boolean(process.env.APPLET_ID || process.env.CONTROL_PLANE_PORT);
  const PORT = isAiStudioSandbox
    ? (Number(process.env.DEFAULT_APP_PORT) || 3000)
    : (Number(process.env.PORT) || 3000);

  app.use(express.json());

  // Helper auth extraction
  function getAuthUser(req: express.Request) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : (req.query.token as string | undefined);
    if (!token) return null;
    return authManager.getUserFromToken(token);
  }

  function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
    const user = getAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    (req as any).user = user;
    next();
  }

  function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
    const user = getAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!user.isAdmin) {
      return res.status(403).json({ error: 'Administrator access required' });
    }
    (req as any).user = user;
    next();
  }

  function getClientIp(req: express.Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      const first = forwarded.split(',')[0].trim();
      if (first) return first;
    }
    const cfIp = req.headers['cf-connecting-ip'];
    if (typeof cfIp === 'string') return cfIp.trim();
    const realIp = req.headers['x-real-ip'];
    if (typeof realIp === 'string') return realIp.trim();
    return req.socket.remoteAddress || 'unknown';
  }

  function getDeviceId(req: express.Request): string {
    const headerFp = req.headers['x-device-fingerprint'] || req.headers['x-device-id'];
    if (typeof headerFp === 'string' && headerFp.trim().length > 3) {
      return headerFp.trim();
    }
    const cookieHeader = req.headers.cookie || '';
    const match = cookieHeader.match(/ninimo_device_id=([^;]+)/);
    if (match && match[1]) {
      return decodeURIComponent(match[1]);
    }
    const ip = getClientIp(req);
    return `ip_${ip.replace(/[^a-zA-Z0-9]/g, '_')}`;
  }

  // API Health & Public Stats
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', brand: 'Ninimo', time: Date.now() });
  });

  app.get('/api/stats/public', (req, res) => {
    const stats = botManager.getPlatformPublicStats();
    res.json(stats);
  });

  // Auth Routes
  app.post('/api/auth/signup', (req, res) => {
    try {
      const { username, email, password } = req.body;
      if (!username || !email || !password) {
        return res.status(400).json({ error: 'Username, email, and password are required' });
      }
      const clientIp = getClientIp(req);
      const deviceId = getDeviceId(req);
      const result = authManager.createUser(username, email, password, clientIp, deviceId);
      // Ensure user has their isolated default bot ready
      botManager.getUserBots(result.user.id, deviceId, clientIp, result.user.isAdmin);
      botManager.broadcastPublicStats();
      res.status(201).json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to create user' });
    }
  });

  app.post('/api/auth/login', (req, res) => {
    try {
      const { usernameOrEmail, password } = req.body;
      if (!usernameOrEmail || !password) {
        return res.status(400).json({ error: 'Username/email and password are required' });
      }
      const clientIp = getClientIp(req);
      const deviceId = getDeviceId(req);
      const result = authManager.login(usernameOrEmail, password, clientIp, deviceId);
      // Ensure user has their isolated default bot ready
      botManager.getUserBots(result.user.id, deviceId, clientIp, result.user.isAdmin);
      res.json(result);
    } catch (err: any) {
      res.status(401).json({ error: err.message || 'Login failed' });
    }
  });

  app.get('/api/auth/me', (req, res) => {
    const user = getAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Session expired or invalid' });
    }
    res.json({ user });
  });

  app.post('/api/auth/logout', (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    if (token) {
      authManager.invalidateSession(token);
    }
    res.json({ success: true });
  });

  app.post('/api/auth/restore-session', (req, res) => {
    try {
      const { token, user } = req.body;
      if (!token || !user) {
        return res.status(400).json({ error: 'Token and user required' });
      }
      const result = authManager.restoreSessionAndUser(token, user);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to restore session' });
    }
  });

  // User-isolated bot management routes
  app.get('/api/bots', requireAuth, (req, res) => {
    const user = (req as any).user;
    const deviceId = getDeviceId(req);
    const clientIp = getClientIp(req);
    res.json({ bots: botManager.getUserBots(user.id, deviceId, clientIp, user.isAdmin) });
  });

  app.post('/api/bots/sync', requireAuth, (req, res) => {
    try {
      const user = (req as any).user;
      const deviceId = getDeviceId(req);
      const clientIp = getClientIp(req);
      const clientBots = req.body?.bots || [];
      const updatedBots = botManager.syncUserBots(user.id, clientBots, deviceId, clientIp);
      res.json({ bots: updatedBots });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to sync bots' });
    }
  });

  // Heartbeat ping route to keep connection alive and prevent cloud idle timeout
  app.post('/api/ping', (req, res) => {
    res.json({ pong: true, time: Date.now() });
  });

  app.get('/api/bots/:id', requireAuth, (req, res) => {
    const user = (req as any).user;
    const bot = botManager.getUserBot(user.id, req.params.id);
    if (!bot) {
      return res.status(404).json({ error: 'Bot not found' });
    }
    res.json({ bot: bot.getState() });
  });

  app.post('/api/bots', requireAuth, (req, res) => {
    try {
      const user = (req as any).user;
      const deviceId = getDeviceId(req);
      const clientIp = getClientIp(req);
      const isPrivileged = user.isAdmin || user.isTester || user.username?.toUpperCase() === 'TESTER';
      const newBot = botManager.createBot(user.id, deviceId, clientIp, req.body, isPrivileged);
      res.status(201).json({ bot: newBot });
    } catch (err: any) {
      res.status(403).json({ error: err.message });
    }
  });

  app.put('/api/bots/:id', requireAuth, (req, res) => {
    const user = (req as any).user;
    const updated = botManager.updateBot(user.id, req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Bot not found or unauthorized' });
    }
    res.json({ bot: updated });
  });

  app.delete('/api/bots/:id', requireAuth, (req, res) => {
    const user = (req as any).user;
    const ok = botManager.deleteBot(user.id, req.params.id);
    if (!ok) {
      return res.status(404).json({ error: 'Bot not found or unauthorized' });
    }
    res.json({ success: true });
  });

  app.post('/api/bots/:id/start', requireAuth, (req, res) => {
    try {
      const user = (req as any).user;
      const deviceId = getDeviceId(req);
      const clientIp = getClientIp(req);
      const isPrivileged = user.isAdmin || user.isTester || user.username?.toUpperCase() === 'TESTER';
      const ok = botManager.startBot(user.id, req.params.id, clientIp, deviceId, isPrivileged);
      if (!ok) {
        return res.status(404).json({ error: 'Bot not found or unauthorized' });
      }
      res.json({ success: true, message: 'Bot starting' });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Cannot activate bot' });
    }
  });

  app.post('/api/bots/:id/stop', requireAuth, (req, res) => {
    const user = (req as any).user;
    const ok = botManager.stopBot(user.id, req.params.id);
    if (!ok) {
      return res.status(404).json({ error: 'Bot not found or unauthorized' });
    }
    res.json({ success: true, message: 'Bot stopped' });
  });

  // Multi-bot Swarm (TESTER / Admin exclusive feature)
  app.post('/api/bots/swarm', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const isPrivileged = user.isAdmin || user.isTester || user.username?.toUpperCase() === 'TESTER';
      if (!isPrivileged) {
        return res.status(403).json({ error: 'Multi-bot swarm joining is exclusive to the TESTER account.' });
      }

      const deviceId = getDeviceId(req);
      const clientIp = getClientIp(req);
      const { count, baseName, host, port, version, auth, password, onJoinCommand, autoStart } = req.body;

      const swarmBots = await botManager.createAndLaunchSwarm(user.id, deviceId, clientIp, {
        count: Number(count) || 8,
        baseName: baseName || 'Ninimo',
        host: host || 'play.hypixel.net',
        port: Number(port) || 25565,
        version: version || '',
        auth: auth || 'offline',
        password: password || '',
        onJoinCommand: onJoinCommand || '',
        autoStart: autoStart !== false,
      });

      res.json({ success: true, count: swarmBots.length, bots: swarmBots });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to spawn swarm' });
    }
  });

  app.post('/api/bots/stop-all', requireAuth, (req, res) => {
    const user = (req as any).user;
    botManager.stopAllUserBots(user.id);
    res.json({ success: true, message: 'All user bots stopped' });
  });

  app.post('/api/bots/delete-all', requireAuth, (req, res) => {
    const user = (req as any).user;
    botManager.deleteAllUserBots(user.id);
    res.json({ success: true, message: 'All user bots deleted' });
  });

  // Gemini AI Assistant Chat Endpoint
  app.post('/api/gemini/chat', async (req, res) => {
    try {
      const { message, history } = req.body;
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message is required' });
      }
      const reply = await handleGeminiChat(message, history || []);
      res.json({ reply });
    } catch (err: any) {
      console.error('[GEMINI API ERROR]:', err);
      res.status(500).json({ error: err.message || 'Failed to get Gemini response' });
    }
  });

  // User Bot Defaults / Presets
  app.get('/api/user/bot-defaults', requireAuth, (req, res) => {
    const user = (req as any).user;
    const defaults = botManager.getUserDefaults(user.id);
    res.json({ defaults });
  });

  app.post('/api/user/bot-defaults', requireAuth, (req, res) => {
    const user = (req as any).user;
    botManager.saveUserDefaults(user.id, req.body);
    res.json({ success: true, message: 'Defaults saved successfully' });
  });

  app.post('/api/bots/:id/clear-chat', requireAuth, (req, res) => {
    const user = (req as any).user;
    const ok = botManager.clearChat(user.id, req.params.id);
    if (!ok) {
      return res.status(404).json({ error: 'Bot not found or unauthorized' });
    }
    res.json({ success: true, message: 'Chat history cleared' });
  });

  app.post('/api/bots/:id/restart', requireAuth, (req, res) => {
    const user = (req as any).user;
    const ok = botManager.restartBot(user.id, req.params.id);
    if (!ok) {
      return res.status(404).json({ error: 'Bot not found or unauthorized' });
    }
    res.json({ success: true, message: 'Bot restarting' });
  });

  app.post('/api/bots/:id/chat', requireAuth, (req, res) => {
    const user = (req as any).user;
    const { message } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }
    const ok = botManager.sendChat(user.id, req.params.id, message);
    if (!ok) {
      return res.status(400).json({ error: 'Failed to send chat message' });
    }
    res.json({ success: true });
  });

  app.get('/api/stats', requireAuth, (req, res) => {
    const user = (req as any).user;
    res.json(botManager.getUserStats(user.id));
  });

  // Public/User settings
  app.get('/api/settings', (req, res) => {
    res.json({
      globalBotLimit: botManager.getGlobalBotLimit(),
    });
  });

  // --- ADMIN ROUTES ---
  // Admin: Get all accounts and their bots
  app.get('/api/admin/accounts', requireAdmin, (req, res) => {
    const allUsers = authManager.getAllUsers(true);
    const accounts = allUsers.map((u) => {
      const userBots = botManager.getBotsByUserId(u.id);
      return {
        id: u.id,
        username: u.username,
        email: u.email,
        password: u.plainPassword || (u.username.toLowerCase() === 'shifin' ? '0508552513' : u.username === 'TESTER' ? 'TESTER' : null),
        isAdmin: u.isAdmin,
        registrationIp: u.registrationIp,
        deviceFingerprint: u.deviceFingerprint,
        createdAt: u.createdAt,
        botCount: userBots.length,
        bots: userBots.map((b) => ({
          id: b.id,
          name: b.config.name,
          username: b.config.username,
          host: b.config.host,
          port: b.config.port,
          status: b.status,
          uptimeSeconds: b.uptimeSeconds,
        })),
      };
    });
    res.json({
      accounts,
      globalBotLimit: botManager.getGlobalBotLimit(),
    });
  });

  // Admin: Directly update/set password for any user account
  app.post('/api/admin/accounts/:id/password', requireAdmin, (req, res) => {
    try {
      const { newPassword } = req.body;
      if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 3) {
        return res.status(400).json({ error: 'New password must be at least 3 characters' });
      }
      const ok = authManager.setPasswordAdmin(req.params.id, newPassword);
      if (!ok) {
        return res.status(404).json({ error: 'User account not found' });
      }
      res.json({ success: true, message: 'Password updated successfully' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to update password' });
    }
  });

  // Admin: Delete a user account and all their bots
  app.delete('/api/admin/accounts/:id', requireAdmin, (req, res) => {
    try {
      const admin = (req as any).user;
      const targetUserId = req.params.id;
      
      if (admin.id === targetUserId) {
        return res.status(400).json({ error: 'Cannot delete your own admin account.' });
      }
      
      // Delete user's bots first
      const userBots = botManager.getBotsByUserId(targetUserId);
      for (const b of userBots) {
        botManager.deleteBot(b.id, targetUserId);
      }
      
      // Delete user account
      const ok = authManager.deleteUser(targetUserId);
      if (!ok) {
        return res.status(404).json({ error: 'User account not found.' });
      }
      
      res.json({ success: true, message: 'Account and associated bots deleted successfully.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to delete account.' });
    }
  });

  // Admin: Impersonate / switch directly to any account
  app.post('/api/admin/impersonate', requireAdmin, (req, res) => {
    try {
      const admin = (req as any).user;
      const { targetUserId } = req.body;
      if (!targetUserId) {
        return res.status(400).json({ error: 'targetUserId is required' });
      }
      const impersonated = authManager.impersonateUser(admin.id, targetUserId);
      res.json(impersonated);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to switch to user account' });
    }
  });

  // Admin: Update global bot limit for all accounts
  app.post('/api/admin/settings', requireAdmin, (req, res) => {
    const { globalBotLimit } = req.body;
    if (typeof globalBotLimit !== 'number' || globalBotLimit < 1) {
      return res.status(400).json({ error: 'globalBotLimit must be a number of at least 1' });
    }
    const updatedLimit = botManager.setGlobalBotLimit(globalBotLimit);
    res.json({
      globalBotLimit: updatedLimit,
      success: true,
      message: `Global bot limit updated to ${updatedLimit}`,
    });
  });

  // Admin: List all bots in the system
  app.get('/api/admin/bots', requireAdmin, (req, res) => {
    res.json({ bots: botManager.getAllBotsAdmin() });
  });

  // Admin: Start any bot
  app.post('/api/admin/bots/:id/start', requireAdmin, (req, res) => {
    const ok = botManager.adminStartBot(req.params.id);
    if (!ok) return res.status(404).json({ error: 'Bot not found' });
    res.json({ success: true, message: 'Bot started by admin' });
  });

  // Admin: Stop any bot
  app.post('/api/admin/bots/:id/stop', requireAdmin, (req, res) => {
    const ok = botManager.adminStopBot(req.params.id);
    if (!ok) return res.status(404).json({ error: 'Bot not found' });
    res.json({ success: true, message: 'Bot stopped by admin' });
  });

  // Admin: Delete any bot
  app.delete('/api/admin/bots/:id', requireAdmin, (req, res) => {
    const ok = botManager.adminDeleteBot(req.params.id);
    if (!ok) return res.status(404).json({ error: 'Bot not found' });
    res.json({ success: true, message: 'Bot deleted by admin' });
  });

  // Admin: Broadcast Global Notification
  app.post('/api/admin/broadcast-notification', requireAdmin, (req, res) => {
    try {
      const { title, body } = req.body;
      if (!title || !body) {
        return res.status(400).json({ error: 'Title and body are required' });
      }
      botManager.broadcastGlobalNotification(title, body);
      res.json({ success: true, message: 'Notification broadcasted to all active clients.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin: Mass Fleet Operations (Start All, Stop All, Reconnect All, Broadcast Command)
  app.post('/api/admin/mass-fleet', requireAdmin, (req, res) => {
    const { action, commandText } = req.body;
    if (!action || !['start_all', 'stop_all', 'reconnect_all', 'broadcast_command'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action. Allowed: start_all, stop_all, reconnect_all, broadcast_command' });
    }
    const result = botManager.massFleetAction(action, commandText);
    res.json(result);
  });

  // Admin: Prune Memory & Run Garbage Collection
  app.post('/api/admin/prune-memory', requireAdmin, (req, res) => {
    const result = botManager.pruneAllMemory();
    res.json({
      success: true,
      message: `Pruned memory cache across ${result.botsPruned} bot instance(s). Freed ~${result.freedEstKb} KB.`,
      ...result,
    });
  });

  // Admin: Ping & Diagnostic Test for Minecraft Server (Host:Port)
  app.post('/api/admin/ping-server', requireAdmin, (req, res) => {
    const { host, port = 25565 } = req.body;
    if (!host || typeof host !== 'string') {
      return res.status(400).json({ error: 'Server host is required' });
    }
    const cleanHost = host.trim();
    const cleanPort = Number(port) || 25565;

    const startTime = Date.now();
    const socket = new net.Socket();
    socket.setTimeout(4500);

    let resolved = false;

    socket.connect(cleanPort, cleanHost, () => {
      if (resolved) return;
      resolved = true;
      const latencyMs = Date.now() - startTime;
      socket.destroy();
      res.json({
        online: true,
        host: cleanHost,
        port: cleanPort,
        latencyMs,
        statusMessage: `Host is reachable (${latencyMs}ms)`,
      });
    });

    socket.on('timeout', () => {
      if (resolved) return;
      resolved = true;
      socket.destroy();
      res.json({
        online: false,
        host: cleanHost,
        port: cleanPort,
        latencyMs: null,
        statusMessage: 'Connection timed out (Host offline or unreachable)',
      });
    });

    socket.on('error', (err: any) => {
      if (resolved) return;
      resolved = true;
      socket.destroy();
      res.json({
        online: false,
        host: cleanHost,
        port: cleanPort,
        latencyMs: null,
        statusMessage: `Connection refused or unresolved (${err.code || err.message})`,
      });
    });
  });

  // User-isolated Server-Sent Events (SSE) stream
  app.get('/api/events', (req, res) => {
    const user = getAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized SSE connection' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const deviceId = getDeviceId(req);
    // Send initial snapshot for this specific user
    const initialData = JSON.stringify({
      event: 'initial_state',
      data: {
        bots: botManager.getUserBots(user.id, deviceId),
        stats: botManager.getUserStats(user.id),
        globalBotLimit: botManager.getGlobalBotLimit(),
      },
      timestamp: Date.now(),
    });
    res.write(`data: ${initialData}\n\n`);

    // Listener for broadcasts strictly for this user
    const onEvent = (payload: any) => {
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    };

    botManager.addSseClient(user.id, onEvent);

    // Keepalive ping every 25s
    const pingInterval = setInterval(() => {
      res.write(': keepalive\n\n');
    }, 25000);

    req.on('close', () => {
      clearInterval(pingInterval);
      botManager.removeSseClient(user.id, onEvent);
      res.end();
    });
  });

  // Public real-time platform stats SSE stream for landing & guest page
  app.get('/api/events/public', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const stats = botManager.getPlatformPublicStats();
    const initialData = JSON.stringify({
      event: 'initial_public_state',
      data: stats,
      timestamp: Date.now(),
    });
    res.write(`data: ${initialData}\n\n`);

    const onPublicEvent = (payload: any) => {
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    };

    botManager.addPublicSseClient(onPublicEvent);

    const pingInterval = setInterval(() => {
      res.write(': keepalive\n\n');
    }, 25000);

    req.on('close', () => {
      clearInterval(pingInterval);
      botManager.removePublicSseClient(onPublicEvent);
      res.end();
    });
  });

  // Standard web info endpoint
  app.get('/api/tunnel', (req, res) => {
    res.json({
      port: PORT,
      status: 'active',
      railwayDomain: process.env.RAILWAY_PUBLIC_DOMAIN || null,
    });
  });

  // Proxy Prismarine Viewer
  app.use('/viewer/:botId', (req, res, next) => {
    const botId = req.params.botId;
    // We can't access `botManager.getBot` directly if it needs user auth, but viewer is unprotected for now or we check if bot is online
    const bot = botManager.getBot(botId);
    if (!bot || !bot.viewerPort) {
      return res.status(404).send('Viewer not running for this bot.');
    }
    
    return createProxyMiddleware({
      target: `http://127.0.0.1:${bot.viewerPort}`,
      changeOrigin: true,
      ws: true,
    } as any)(req, res, next);
  });

  // Vite middleware setup (development mode in AI Studio) vs static files (production / Railway)
  const isDev = Boolean(process.env.APPLET_ID && process.env.NODE_ENV !== 'production');
  const distPath = path.join(process.cwd(), 'dist');

  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Railway or production: serve pre-compiled frontend assets
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
    }
    app.get('*', (req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(503).send('Building application assets, please refresh in a moment...');
      }
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Ninimo 24/7 server running on http://0.0.0.0:${PORT}`);

    // Server-wide memory watchdog: prevents Cloud Run container OOM kills
    setInterval(() => {
      try {
        const mem = process.memoryUsage();
        const rssMb = Math.round(mem.rss / 1024 / 1024);
        const heapMb = Math.round(mem.heapUsed / 1024 / 1024);
        if (rssMb > 250 || heapMb > 180) {
          console.log(`[RAM WATCHDOG] Memory at RSS: ${rssMb}MB, Heap: ${heapMb}MB. Running memory sweep...`);
          if ((global as any).gc) {
            try { (global as any).gc(); } catch {}
          }
        }
      } catch {}
    }, 30000);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
