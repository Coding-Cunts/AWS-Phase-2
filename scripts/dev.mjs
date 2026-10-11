#!/usr/bin/env node
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

console.log('\x1b[36m%s\x1b[0m', '═══════════════════════════════════════════════════════════════════');
console.log('\x1b[1m\x1b[32m%s\x1b[0m', '  TERRA — Unified Application Runner');
console.log('\x1b[36m%s\x1b[0m', '  Frontend: http://localhost:3000  (Next.js 16 + React 19)');
console.log('\x1b[36m%s\x1b[0m', '  Backend:  http://localhost:3001  (Express + Gemini Vision AI)');
console.log('\x1b[36m%s\x1b[0m', '═══════════════════════════════════════════════════════════════════\n');

function runService(name, color, cwd, command, args, extraEnv = {}) {
  const proc = spawn(command, args, {
    cwd,
    env: { ...process.env, ...extraEnv },
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: isWindows,
  });

  const prefix = `${color}[${name}]\x1b[0m `;

  proc.stdout.on('data', data => {
    const lines = data.toString().split('\n');
    for (const line of lines) {
      if (line.trim()) process.stdout.write(prefix + line + '\n');
    }
  });

  proc.stderr.on('data', data => {
    const lines = data.toString().split('\n');
    for (const line of lines) {
      if (line.trim()) process.stderr.write(prefix + line + '\n');
    }
  });

  proc.on('close', code => {
    if (code !== 0 && code !== null) {
      console.log(`${prefix}exited with code ${code}`);
    }
  });

  return proc;
}

const backendProc = runService(
  'Backend :3001',
  '\x1b[33m',
  path.join(rootDir, 'backend'),
  npmCmd,
  ['run', 'start'],
  { PORT: '3001' }
);

const frontendProc = runService(
  'Frontend :3000',
  '\x1b[34m',
  path.join(rootDir, 'frontend'),
  npmCmd,
  ['run', 'dev', '--', '-p', '3000'],
  { BACKEND_URL: 'http://127.0.0.1:3001', PORT: '3000' }
);

function cleanup() {
  console.log('\n\x1b[33mShutting down TERRA services...\x1b[0m');
  try {
    if (isWindows) {
      if (backendProc.pid) spawn('taskkill', ['/pid', backendProc.pid.toString(), '/T', '/F']);
      if (frontendProc.pid) spawn('taskkill', ['/pid', frontendProc.pid.toString(), '/T', '/F']);
    } else {
      backendProc.kill('SIGTERM');
      frontendProc.kill('SIGTERM');
    }
  } catch {
    // Ignore errors during termination
  }
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
