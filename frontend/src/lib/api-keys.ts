import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface ApiKeyRecord {
  id: string;
  key: string;
  label: string;
  createdAt: string;
  requestCount: number;
  status: 'active' | 'revoked';
  lastUsedAt?: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const KEYS_FILE = path.join(DATA_DIR, 'api_keys.json');

// In-memory cache for fast lookups and fallback
let inMemoryKeys: ApiKeyRecord[] | null = null;

/**
 * Ensures the data directory exists and returns initialized keys.
 */
function ensureDataStore(): ApiKeyRecord[] {
  if (inMemoryKeys !== null) {
    return inMemoryKeys;
  }

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(KEYS_FILE)) {
      const raw = fs.readFileSync(KEYS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        inMemoryKeys = parsed;
        return inMemoryKeys;
      }
    }

    // Seed default robotics key if fresh store
    const initialKey: ApiKeyRecord = {
      id: 'key_default_robotics',
      key: `terra_${crypto.randomBytes(24).toString('hex')}`,
      label: 'Default Robotics Client (Automated Infeed)',
      createdAt: new Date().toISOString(),
      requestCount: 0,
      status: 'active',
    };

    inMemoryKeys = [initialKey];
    fs.writeFileSync(KEYS_FILE, JSON.stringify(inMemoryKeys, null, 2), 'utf-8');
    return inMemoryKeys;
  } catch (err) {
    console.error('[API Keys Store] Error reading keys file:', err);
    if (!inMemoryKeys) {
      inMemoryKeys = [
        {
          id: 'key_default_robotics',
          key: `terra_${crypto.randomBytes(24).toString('hex')}`,
          label: 'Default Robotics Client',
          createdAt: new Date().toISOString(),
          requestCount: 0,
          status: 'active',
        },
      ];
    }
    return inMemoryKeys;
  }
}

/**
 * Persists keys array to disk and updates in-memory cache.
 */
function persistKeys(keys: ApiKeyRecord[]): void {
  inMemoryKeys = keys;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(KEYS_FILE, JSON.stringify(keys, null, 2), 'utf-8');
  } catch (err) {
    console.error('[API Keys Store] Failed to persist keys to disk:', err);
  }
}

/**
 * Retrieves all registered API keys.
 */
export async function getApiKeys(): Promise<ApiKeyRecord[]> {
  return ensureDataStore();
}

/**
 * Generates and stores a new cryptographically secure API key.
 * Format: terra_<48 hex chars>
 */
export async function generateApiKey(label?: string): Promise<ApiKeyRecord> {
  const keys = ensureDataStore();
  const hex = crypto.randomBytes(24).toString('hex');
  const keyString = `terra_${hex}`;
  const id = `key_${crypto.randomUUID().slice(0, 8)}`;

  const newKey: ApiKeyRecord = {
    id,
    key: keyString,
    label: (label && label.trim()) || `Robotics Node · ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
    createdAt: new Date().toISOString(),
    requestCount: 0,
    status: 'active',
  };

  keys.unshift(newKey);
  persistKeys(keys);
  return newKey;
}

/**
 * Validates whether an incoming API key is active.
 */
export async function validateApiKey(
  keyToCheck: string
): Promise<{ valid: boolean; keyRecord?: ApiKeyRecord; error?: string }> {
  if (!keyToCheck || typeof keyToCheck !== 'string') {
    return { valid: false, error: 'Missing API key header' };
  }

  const cleanKey = keyToCheck.trim();
  const keys = ensureDataStore();
  const record = keys.find((k) => k.key === cleanKey);

  if (!record) {
    return { valid: false, error: 'Invalid API key provided' };
  }

  if (record.status === 'revoked') {
    return { valid: false, error: 'API key has been revoked' };
  }

  return { valid: true, keyRecord: record };
}

/**
 * Increments the request counter and updates lastUsedAt for a key.
 */
export async function incrementKeyUsage(keyString: string): Promise<void> {
  const keys = ensureDataStore();
  const record = keys.find((k) => k.key === keyString.trim());
  if (record) {
    record.requestCount = (record.requestCount || 0) + 1;
    record.lastUsedAt = new Date().toISOString();
    persistKeys(keys);
  }
}

/**
 * Revokes an existing API key by ID or Key string.
 */
export async function revokeApiKey(idOrKey: string): Promise<boolean> {
  const keys = ensureDataStore();
  const target = keys.find((k) => k.id === idOrKey || k.key === idOrKey);
  if (!target) {
    return false;
  }

  target.status = 'revoked';
  persistKeys(keys);
  return true;
}

/**
 * Permanently deletes an API key record.
 */
export async function deleteApiKey(idOrKey: string): Promise<boolean> {
  const keys = ensureDataStore();
  const idx = keys.findIndex((k) => k.id === idOrKey || k.key === idOrKey);
  if (idx === -1) {
    return false;
  }

  keys.splice(idx, 1);
  persistKeys(keys);
  return true;
}
