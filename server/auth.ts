import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const LEGACY_USERS_FILE = path.join(process.cwd(), 'users.json');
const LEGACY_SESSIONS_FILE = path.join(process.cwd(), 'sessions.json');

// Block known throwaway & disposable email domains
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  '10minutemail.com',
  'guerrillamail.com',
  'temp-mail.org',
  'throwawaymail.com',
  'sharklasers.com',
  'getairmail.com',
  'yopmail.com',
  'dispostable.com',
  'trashmail.com',
  'tempmail.com',
  'fakeinbox.com',
  'mohmal.com',
  'maildrop.cc',
  'inboxkitten.com',
  'crazymailing.com',
  'burnermail.io',
  'mytemp.email',
  'tempail.com',
  'temp-mail.io',
  'generator.email',
  'mytempemail.com',
  'emailondeck.com',
  'fakemailgenerator.com',
]);

export function normalizeEmail(email: string): { normalized: string; rootDomain: string; isDisposable: boolean } {
  const clean = email.trim().toLowerCase();
  const parts = clean.split('@');
  if (parts.length !== 2) {
    return { normalized: clean, rootDomain: '', isDisposable: false };
  }
  let [local, domain] = parts;
  const isDisposable = DISPOSABLE_DOMAINS.has(domain);

  // Normalize gmail / googlemail: remove dots and strip +alias
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    domain = 'gmail.com';
    local = local.split('+')[0];
    local = local.replace(/\./g, '');
  } else {
    // Strip +alias for any provider
    local = local.split('+')[0];
  }

  return {
    normalized: `${local}@${domain}`,
    rootDomain: domain,
    isDisposable,
  };
}

export interface User {
  id: string;
  username: string;
  email: string;
  normalizedEmail?: string;
  passwordHash: string;
  salt: string;
  plainPassword?: string;
  isAdmin?: boolean;
  isTester?: boolean;
  registrationIp?: string;
  deviceFingerprint?: string;
  createdAt: number;
}

export interface UserPublic {
  id: string;
  username: string;
  email: string;
  plainPassword?: string;
  isAdmin?: boolean;
  isTester?: boolean;
  registrationIp?: string;
  deviceFingerprint?: string;
  createdAt: number;
}

class AuthManager {
  private users: Map<string, User> = new Map(); // key: user.id
  private sessions: Map<string, string> = new Map(); // token -> userId

  constructor() {
    this.loadUsers();
    this.loadSessions();
    this.ensureSpecialUsers();
  }

  private loadUsers() {
    const filesToTry = [USERS_FILE, `${USERS_FILE}.backup`, LEGACY_USERS_FILE];
    for (const file of filesToTry) {
      if (fs.existsSync(file)) {
        try {
          const raw = fs.readFileSync(file, 'utf-8');
          const list: User[] = JSON.parse(raw);
          if (Array.isArray(list) && list.length > 0) {
            for (const u of list) {
              if (!u.normalizedEmail && u.email) {
                u.normalizedEmail = normalizeEmail(u.email).normalized;
              }
              this.users.set(u.id, u);
            }
            return;
          }
        } catch (err) {
          console.error(`Failed to load ${file}:`, err);
        }
      }
    }
  }

  private saveUsers() {
    try {
      const list = Array.from(this.users.values());
      const data = JSON.stringify(list, null, 2);
      const tmpFile = `${USERS_FILE}.tmp`;
      fs.writeFileSync(tmpFile, data, 'utf-8');
      fs.renameSync(tmpFile, USERS_FILE);
      // Also write backup
      try {
        fs.writeFileSync(`${USERS_FILE}.backup`, data, 'utf-8');
      } catch {}
    } catch (err) {
      console.error('Failed to save users.json:', err);
    }
  }

  private loadSessions() {
    const filesToTry = [SESSIONS_FILE, `${SESSIONS_FILE}.backup`, LEGACY_SESSIONS_FILE];
    for (const file of filesToTry) {
      if (fs.existsSync(file)) {
        try {
          const raw = fs.readFileSync(file, 'utf-8');
          const obj = JSON.parse(raw);
          if (obj && typeof obj === 'object') {
            for (const [token, userId] of Object.entries(obj)) {
              if (typeof token === 'string' && typeof userId === 'string') {
                this.sessions.set(token, userId);
              }
            }
            return;
          }
        } catch (err) {
          console.error(`Failed to load ${file}:`, err);
        }
      }
    }
  }

  private saveSessions() {
    try {
      const obj: Record<string, string> = {};
      for (const [token, userId] of this.sessions.entries()) {
        obj[token] = userId;
      }
      const data = JSON.stringify(obj, null, 2);
      const tmpFile = `${SESSIONS_FILE}.tmp`;
      fs.writeFileSync(tmpFile, data, 'utf-8');
      fs.renameSync(tmpFile, SESSIONS_FILE);
      try {
        fs.writeFileSync(`${SESSIONS_FILE}.backup`, data, 'utf-8');
      } catch {}
    } catch (err) {
      console.error('Failed to save sessions.json:', err);
    }
  }

  public ensureSpecialUsers() {
    this.ensureAdminUser();
    this.ensureTesterUser();
  }

  public ensureAdminUser() {
    const adminUsername = 'Shifin';
    const adminPassword = '0508552513';
    let admin = Array.from(this.users.values()).find(
      (u) => u.username.toLowerCase() === adminUsername.toLowerCase()
    );

    const salt = admin?.salt || crypto.randomBytes(16).toString('hex');
    const passwordHash = this.hashPassword(adminPassword, salt);

    if (!admin) {
      const id = 'user-admin-shifin';
      admin = {
        id,
        username: adminUsername,
        email: 'shifinkallan16@gmail.com',
        normalizedEmail: 'shifinkallan16@gmail.com',
        passwordHash,
        salt,
        plainPassword: adminPassword,
        isAdmin: true,
        registrationIp: '127.0.0.1',
        deviceFingerprint: 'admin-master-device',
        createdAt: 1700000000000,
      };
      this.users.set(id, admin);
      this.saveUsers();
    } else {
      // Ensure password and admin privileges are always up to date
      admin.passwordHash = passwordHash;
      admin.salt = salt;
      admin.plainPassword = adminPassword;
      admin.isAdmin = true;
      admin.normalizedEmail = 'shifinkallan16@gmail.com';
      this.saveUsers();
    }
  }

  public ensureTesterUser() {
    const testerUsername = 'TESTER';
    const testerPassword = 'TESTER';
    let tester = Array.from(this.users.values()).find(
      (u) => u.username.toLowerCase() === testerUsername.toLowerCase()
    );

    const salt = tester?.salt || crypto.randomBytes(16).toString('hex');
    const passwordHash = this.hashPassword(testerPassword, salt);

    if (!tester) {
      const id = 'user-tester-special';
      tester = {
        id,
        username: testerUsername,
        email: 'tester@ninimo.local',
        normalizedEmail: 'tester@ninimo.local',
        passwordHash,
        salt,
        plainPassword: testerPassword,
        isAdmin: false,
        isTester: true,
        registrationIp: '127.0.0.1',
        deviceFingerprint: 'tester-device',
        createdAt: 1700000000000,
      };
      this.users.set(id, tester);
      this.saveUsers();
    } else {
      tester.passwordHash = passwordHash;
      tester.salt = salt;
      tester.plainPassword = testerPassword;
      tester.isTester = true;
      this.saveUsers();
    }
  }

  private hashPassword(password: string, salt: string): string {
    return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  }

  public createUser(
    username: string,
    email: string,
    password: string,
    clientIp?: string,
    deviceFingerprint?: string
  ): { user: UserPublic; token: string } {
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim().toLowerCase();

    // Basic Validation
    if (trimmedUsername.length < 3) {
      throw new Error('Username must be at least 3 characters');
    }
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    const { normalized, isDisposable } = normalizeEmail(trimmedEmail);

    if (isDisposable) {
      throw new Error('Disposable or temporary email addresses are not permitted. Please use a permanent email.');
    }

    const isShifinAdmin = trimmedUsername.toLowerCase() === 'shifin';

    // Check duplicate username or email
    for (const u of this.users.values()) {
      if (u.username.toLowerCase() === trimmedUsername.toLowerCase()) {
        throw new Error('Username is already taken');
      }
      if (u.email.toLowerCase() === trimmedEmail || (u.normalizedEmail && u.normalizedEmail === normalized)) {
        throw new Error('Email address (or alias) is already registered');
      }
    }

    // Strict Anti-Cheese: Multi-Account Restriction per Device & IP
    if (!isShifinAdmin) {
      // 1. Check Device Fingerprint
      if (deviceFingerprint && deviceFingerprint.length > 5) {
        const existingWithDevice = Array.from(this.users.values()).find(
          (u) => !u.isAdmin && u.deviceFingerprint === deviceFingerprint
        );
        if (existingWithDevice) {
          throw new Error(
            `Security Notice: An account ("${existingWithDevice.username}") is already registered from this device/browser. Multiple accounts are restricted to prevent bot limit bypassing.`
          );
        }
      }

      // 2. Check IP Address (if valid external IP)
      if (clientIp && clientIp !== 'unknown' && !clientIp.startsWith('127.') && clientIp !== '::1') {
        const existingWithIp = Array.from(this.users.values()).filter(
          (u) => !u.isAdmin && u.registrationIp === clientIp
        );
        if (existingWithIp.length >= 1) {
          throw new Error(
            'Security Notice: An account is already registered on this network/IP. Bypassing bot limits through multiple accounts is prohibited.'
          );
        }
      }
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = this.hashPassword(password, salt);
    const id = `user-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    const newUser: User = {
      id,
      username: trimmedUsername,
      email: trimmedEmail,
      normalizedEmail: normalized,
      passwordHash,
      salt,
      plainPassword: password,
      isAdmin: isShifinAdmin,
      registrationIp: clientIp || 'unknown',
      deviceFingerprint: deviceFingerprint || 'unknown',
      createdAt: Date.now(),
    };

    this.users.set(id, newUser);
    this.saveUsers();

    const token = this.createSession(id);
    return {
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        isAdmin: newUser.isAdmin,
        registrationIp: newUser.registrationIp,
        deviceFingerprint: newUser.deviceFingerprint,
        createdAt: newUser.createdAt,
      },
      token,
    };
  }

  public login(
    usernameOrEmail: string,
    password: string,
    clientIp?: string,
    deviceFingerprint?: string
  ): { user: UserPublic; token: string } {
    const query = usernameOrEmail.trim().toLowerCase();
    const queryNormalized = normalizeEmail(query).normalized;
    let found: User | null = null;

    for (const u of this.users.values()) {
      if (
        u.username.toLowerCase() === query ||
        u.email.toLowerCase() === query ||
        (u.normalizedEmail && u.normalizedEmail === queryNormalized)
      ) {
        found = u;
        break;
      }
    }

    if (!found) {
      throw new Error('Invalid username or password');
    }

    const inputHash = this.hashPassword(password, found.salt);
    if (inputHash !== found.passwordHash) {
      throw new Error('Invalid username or password');
    }

    // Update IP, fingerprint, and plain password if changed
    found.plainPassword = password;
    if (clientIp && clientIp !== 'unknown') {
      found.registrationIp = clientIp;
    }
    if (deviceFingerprint && deviceFingerprint.length > 5) {
      found.deviceFingerprint = deviceFingerprint;
    }
    this.saveUsers();

    const token = this.createSession(found.id);
    return {
      user: {
        id: found.id,
        username: found.username,
        email: found.email,
        isAdmin: found.isAdmin,
        isTester: found.username.toUpperCase() === 'TESTER' || !!found.isTester,
        registrationIp: found.registrationIp,
        deviceFingerprint: found.deviceFingerprint,
        createdAt: found.createdAt,
      },
      token,
    };
  }

  public getUserFromToken(token: string): UserPublic | null {
    if (!token) return null;
    const userId = this.sessions.get(token);
    if (!userId) return null;
    const u = this.users.get(userId);
    if (!u) return null;
    return {
      id: u.id,
      username: u.username,
      email: u.email,
      isAdmin: u.isAdmin,
      isTester: u.username.toUpperCase() === 'TESTER' || !!u.isTester,
      registrationIp: u.registrationIp,
      deviceFingerprint: u.deviceFingerprint,
      createdAt: u.createdAt,
    };
  }

  public createSession(userId: string): string {
    const token = `ninimo-tok-${crypto.randomBytes(24).toString('hex')}`;
    this.sessions.set(token, userId);
    this.saveSessions();
    return token;
  }

  public restoreSessionAndUser(token: string, user: UserPublic): { user: UserPublic; token: string } {
    if (!token || !user || !user.id) {
      throw new Error('Invalid user or token for session restoration');
    }

    let existing = this.users.get(user.id);
    if (!existing) {
      const byName = Array.from(this.users.values()).find(
        (u) => u.username.toLowerCase() === user.username.toLowerCase()
      );
      if (byName) {
        existing = byName;
      } else {
        const salt = crypto.randomBytes(16).toString('hex');
        const passwordHash = this.hashPassword(crypto.randomBytes(12).toString('hex'), salt);
        const { normalized } = normalizeEmail(user.email || 'user@local.domain');
        existing = {
          id: user.id,
          username: user.username,
          email: user.email,
          normalizedEmail: normalized,
          passwordHash,
          salt,
          isAdmin: user.username.toLowerCase() === 'shifin' || !!user.isAdmin,
          isTester: user.username.toUpperCase() === 'TESTER' || !!user.isTester,
          registrationIp: user.registrationIp || '127.0.0.1',
          deviceFingerprint: user.deviceFingerprint || 'restored-device',
          createdAt: user.createdAt || Date.now(),
        };
        this.users.set(user.id, existing);
        this.saveUsers();
      }
    }

    this.sessions.set(token, existing.id);
    this.saveSessions();

    return {
      user: {
        id: existing.id,
        username: existing.username,
        email: existing.email,
        isAdmin: existing.isAdmin,
        isTester: existing.username.toUpperCase() === 'TESTER' || !!existing.isTester,
        registrationIp: existing.registrationIp,
        deviceFingerprint: existing.deviceFingerprint,
        createdAt: existing.createdAt,
      },
      token,
    };
  }

  public invalidateSession(token: string): boolean {
    const deleted = this.sessions.delete(token);
    if (deleted) this.saveSessions();
    return deleted;
  }

  public getAllUsers(includePasswords = false): UserPublic[] {
    return Array.from(this.users.values()).map((u) => ({
      id: u.id,
      username: u.username,
      email: u.email,
      plainPassword: includePasswords ? (u.plainPassword || (u.username.toLowerCase() === 'shifin' ? '0508552513' : u.username === 'TESTER' ? 'TESTER' : undefined)) : undefined,
      isAdmin: u.isAdmin,
      isTester: u.username.toUpperCase() === 'TESTER' || !!u.isTester,
      registrationIp: u.registrationIp,
      deviceFingerprint: u.deviceFingerprint,
      createdAt: u.createdAt,
    }));
  }

  public setPasswordAdmin(targetUserId: string, newPassword: string): boolean {
    const user = this.users.get(targetUserId);
    if (!user) return false;
    const salt = crypto.randomBytes(16).toString('hex');
    user.salt = salt;
    user.passwordHash = this.hashPassword(newPassword, salt);
    user.plainPassword = newPassword;
    this.saveUsers();
    return true;
  }

  public getUserCount(): number {
    return this.users.size;
  }

  public impersonateUser(adminUserId: string, targetUserId: string): { user: UserPublic; token: string } {
    const admin = this.users.get(adminUserId);
    if (!admin || !admin.isAdmin) {
      throw new Error('Unauthorized: Only administrators can access other user accounts');
    }

    const target = this.users.get(targetUserId);
    if (!target) {
      throw new Error('Target user account not found');
    }

    const token = this.createSession(target.id);
    return {
      user: {
        id: target.id,
        username: target.username,
        email: target.email,
        isAdmin: target.isAdmin,
        registrationIp: target.registrationIp,
        deviceFingerprint: target.deviceFingerprint,
        createdAt: target.createdAt,
      },
      token,
    };
  }
  public deleteUser(targetUserId: string): boolean {
    if (!this.users.has(targetUserId)) {
      return false;
    }
    
    // Remove user
    this.users.delete(targetUserId);
    this.saveUsers();
    
    // Invalidate any sessions belonging to this user
    let sessionsChanged = false;
    for (const [token, uid] of this.sessions.entries()) {
      if (uid === targetUserId) {
        this.sessions.delete(token);
        sessionsChanged = true;
      }
    }
    
    if (sessionsChanged) {
      this.saveSessions();
    }
    
    return true;
  }
}

export const authManager = new AuthManager();

