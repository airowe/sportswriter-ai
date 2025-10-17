import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export type EncryptedValue = {
  iv: string; // base64
  tag: string; // base64
  ciphertext: string; // base64
  createdAt: string; // ISO
};

export type Provider = 'openai' | 'espn' | 'cfbd';

export type MCPServer = {
  id: string;
  name: string;
  url: string;
  type: 'http';
  apiKeyHeaderName?: string; // e.g., 'Authorization'
  apiKeyPrefix?: string; // e.g., 'Bearer'
  apiKey?: EncryptedValue;
  lastStatus?: {
    status: 'unknown' | 'ok' | 'error';
    message?: string;
    checkedAt: string; // ISO
  };
};

export type SettingsData = {
  openaiApiKey?: EncryptedValue;
  espnApiKey?: EncryptedValue;
  cfbdApiKey?: EncryptedValue;
  mcpServers: MCPServer[];
};

const DATA_DIR = path.join(process.cwd());
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

function ensureDataFile() {
  if (!fs.existsSync(SETTINGS_FILE)) {
    const initial: SettingsData = { mcpServers: [] };
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(initial, null, 2));
  }
}

function getMasterKey(): Buffer {
  const mk = process.env.SETTINGS_MASTER_KEY || process.env.MASTER_KEY || 'dev-insecure-master-key-please-change';
  const hash = crypto.createHash('sha256').update(mk).digest();
  return hash; // 32 bytes
}

function encrypt(plain: string): EncryptedValue {
  const key = getMasterKey();
  const iv = crypto.randomBytes(12); // GCM recommended IV size
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    ciphertext: ciphertext.toString('base64'),
    createdAt: new Date().toISOString(),
  };
}

function decrypt(enc?: EncryptedValue): string | null {
  if (!enc) return null;
  try {
    const key = getMasterKey();
    const iv = Buffer.from(enc.iv, 'base64');
    const tag = Buffer.from(enc.tag, 'base64');
    const ciphertext = Buffer.from(enc.ciphertext, 'base64');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (e) {
    return null;
  }
}

export function maskSecret(secret: string | null | undefined): string | null {
  if (!secret) return null;
  const last4 = secret.slice(-4);
  return `••••••••••••${last4}`;
}

export function loadSettings(): SettingsData {
  ensureDataFile();
  const raw = fs.readFileSync(SETTINGS_FILE, 'utf8');
  const json = raw ? JSON.parse(raw) : { mcpServers: [] };
  if (!json.mcpServers) json.mcpServers = [];
  return json as SettingsData;
}

export function saveSettings(settings: SettingsData) {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
}

export function getDecryptedProviderKey(provider: Provider): string | null {
  const settings = loadSettings();
  if (provider === 'openai') return decrypt(settings.openaiApiKey);
  if (provider === 'espn') return decrypt(settings.espnApiKey);
  if (provider === 'cfbd') return decrypt(settings.cfbdApiKey);
  return null;
}

export function setProviderKey(provider: Provider, value: string | null) {
  const settings = loadSettings();
  if (!value) {
    if (provider === 'openai') delete settings.openaiApiKey;
    if (provider === 'espn') delete settings.espnApiKey;
    if (provider === 'cfbd') delete settings.cfbdApiKey;
  } else {
    const enc = encrypt(value);
    if (provider === 'openai') settings.openaiApiKey = enc;
    if (provider === 'espn') settings.espnApiKey = enc;
    if (provider === 'cfbd') settings.cfbdApiKey = enc;
  }
  saveSettings(settings);
}

export function listMcpServers(): MCPServer[] {
  const settings = loadSettings();
  return settings.mcpServers || [];
}

export function addMcpServer(server: Omit<MCPServer, 'id' | 'lastStatus' | 'type' | 'apiKey'> & { apiKey?: string }): MCPServer {
  const settings = loadSettings();
  const id = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
  const toSave: MCPServer = {
    id,
    name: server.name,
    url: server.url,
    type: 'http',
    apiKeyHeaderName: server.apiKeyHeaderName || 'Authorization',
    apiKeyPrefix: server.apiKeyPrefix || 'Bearer',
  };
  if (server.apiKey) {
    toSave.apiKey = encrypt(server.apiKey);
  }
  settings.mcpServers = settings.mcpServers || [];
  settings.mcpServers.push(toSave);
  saveSettings(settings);
  return toSave;
}

export function updateMcpServer(id: string, updates: Partial<Omit<MCPServer, 'id' | 'type' | 'apiKey'>> & { apiKey?: string | null }): MCPServer | null {
  const settings = loadSettings();
  const idx = (settings.mcpServers || []).findIndex(s => s.id === id);
  if (idx === -1) return null;
  const current = settings.mcpServers[idx];
  // Update fields
  if (typeof updates.name === 'string') current.name = updates.name;
  if (typeof updates.url === 'string') current.url = updates.url;
  if (typeof updates.apiKeyHeaderName === 'string') current.apiKeyHeaderName = updates.apiKeyHeaderName;
  if (typeof updates.apiKeyPrefix === 'string') current.apiKeyPrefix = updates.apiKeyPrefix;
  if (updates.apiKey === null) {
    delete current.apiKey;
  } else if (typeof updates.apiKey === 'string') {
    current.apiKey = encrypt(updates.apiKey);
  }
  settings.mcpServers[idx] = current;
  saveSettings(settings);
  return current;
}

export function removeMcpServer(id: string): boolean {
  const settings = loadSettings();
  const before = settings.mcpServers.length;
  settings.mcpServers = settings.mcpServers.filter(s => s.id !== id);
  saveSettings(settings);
  return settings.mcpServers.length < before;
}

export async function testMcpServer(id: string): Promise<{ status: 'ok' | 'error'; message?: string; checkedAt: string } | null> {
  const settings = loadSettings();
  const server = (settings.mcpServers || []).find(s => s.id === id);
  if (!server) return null;
  try {
    const headers: Record<string, string> = {};
    const apiKey = decrypt(server.apiKey || undefined);
    if (apiKey && server.apiKeyHeaderName) {
      const prefix = server.apiKeyPrefix ? server.apiKeyPrefix + ' ' : '';
      headers[server.apiKeyHeaderName] = `${prefix}${apiKey}`;
    }
    const res = await fetch(server.url, { method: 'GET', headers, cache: 'no-store' });
    const ok = res.ok;
    const checkedAt = new Date().toISOString();
    server.lastStatus = { status: ok ? 'ok' : 'error', message: ok ? `HTTP ${res.status}` : `HTTP ${res.status}`, checkedAt };
    saveSettings(settings);
    return server.lastStatus;
  } catch (e: any) {
    const checkedAt = new Date().toISOString();
    server.lastStatus = { status: 'error', message: e?.message || 'Network error', checkedAt };
    saveSettings(settings);
    return server.lastStatus;
  }
}

export function getSettingsOverview() {
  const s = loadSettings();
  const openai = decrypt(s.openaiApiKey);
  const espn = decrypt(s.espnApiKey);
  const cfbd = decrypt(s.cfbdApiKey);
  return {
    openai: { has: !!openai, masked: maskSecret(openai) },
    espn: { has: !!espn, masked: maskSecret(espn) },
    cfbd: { has: !!cfbd, masked: maskSecret(cfbd) },
    mcpServers: (s.mcpServers || []).map((m) => ({
      id: m.id,
      name: m.name,
      url: m.url,
      type: m.type,
      hasApiKey: !!decrypt(m.apiKey || undefined),
      apiKeyHeaderName: m.apiKeyHeaderName,
      apiKeyPrefix: m.apiKeyPrefix,
      lastStatus: m.lastStatus || { status: 'unknown' as const, checkedAt: new Date(0).toISOString() },
    })),
  };
}

export async function validateProviderKey(provider: Provider): Promise<{ ok: boolean; message?: string }> {
  const key = getDecryptedProviderKey(provider);
  if (!key) return { ok: false, message: 'No key set' };
  // Attempt a minimal network check where possible
  try {
    if (provider === 'openai') {
      const res = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        // do not cache
        cache: 'no-store',
      });
      if (res.status === 401) return { ok: false, message: 'Unauthorized (invalid key)' };
      if (!res.ok) return { ok: false, message: `HTTP ${res.status}` };
      return { ok: true };
    }
    if (provider === 'espn') {
      // ESPN APIs vary; do a generic ping to espn.com to at least verify network
      const res = await fetch('https://site.api.espn.com/apis/site/v2/sports', { cache: 'no-store' });
      if (!res.ok) return { ok: false, message: `HTTP ${res.status}` };
      return { ok: true };
    }
    if (provider === 'cfbd') {
      // CFBD public endpoint sample; usually requires header 'x-api-key'
      const res = await fetch('https://api.collegefootballdata.com/teams/fbs?year=2020', {
        headers: { 'x-api-key': key },
        cache: 'no-store',
      });
      if (res.status === 401 || res.status === 403) return { ok: false, message: 'Unauthorized (invalid key)' };
      if (!res.ok) return { ok: false, message: `HTTP ${res.status}` };
      return { ok: true };
    }
    return { ok: false, message: 'Unknown provider' };
  } catch (e: any) {
    return { ok: false, message: e?.message || 'Network error' };
  }
}

export type SettingsOverview = ReturnType<typeof getSettingsOverview>;
