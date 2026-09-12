#!/usr/bin/env node
/**
 * ⚡ Ninimo Bot 24/7 Universal Launcher
 * Designed for 1-Click Startup on Silly Development, Pterodactyl, Railway, VPS, or Localhost.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\n' + '='.repeat(60));
console.log('🤖 Starting Ninimo 24/7 Minecraft Bot Server...');
console.log('='.repeat(60));

// Step 1: Ensure node_modules exists
if (!fs.existsSync(path.join(__dirname, 'node_modules'))) {
  console.log('📦 [Auto-Setup] node_modules not found. Installing dependencies...');
  try {
    execSync('npm install --legacy-peer-deps', { stdio: 'inherit', cwd: __dirname });
    console.log('✅ [Auto-Setup] Dependencies installed successfully!');
  } catch (err) {
    console.error('⚠️ [Auto-Setup] Failed to install dependencies via npm:', err?.message || err);
  }
}

// Step 2: Ensure dist/server.cjs and dist/index.html exist
const serverBundlePath = path.join(__dirname, 'dist', 'server.cjs');
const clientBundlePath = path.join(__dirname, 'dist', 'index.html');

if (!fs.existsSync(serverBundlePath) || !fs.existsSync(clientBundlePath)) {
  console.log('⚡ [Auto-Build] Production build not found. Compiling dashboard and server...');
  try {
    execSync('npm run build', { stdio: 'inherit', cwd: __dirname });
    console.log('✅ [Auto-Build] Build finished successfully!');
  } catch (err) {
    console.error('⚠️ [Auto-Build Error]:', err?.message || err);
  }
}

// Step 3: Run the production server
try {
  if (fs.existsSync(serverBundlePath)) {
    // Directly import the bundled CommonJS server
    await import('./dist/server.cjs');
  } else {
    console.log('🚀 Running server via tsx...');
    execSync('npx tsx server.ts', { stdio: 'inherit', cwd: __dirname });
  }
} catch (err) {
  console.error('❌ Fatal launch error:', err);
  process.exit(1);
}
