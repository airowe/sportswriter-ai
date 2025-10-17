import { getSettingsOverview, setProviderKey, validateProviderKey, addMcpServer, updateMcpServer, removeMcpServer } from '@/lib/secureSettings';
import type { SettingsOverview } from '@/lib/secureSettings';
import SettingsClient from './settingsClient';

export default async function SettingsPage() {
  const initial = getSettingsOverview();

  async function saveApiKeyAction(prev: SettingsOverview, formData: FormData): Promise<SettingsOverview> {
    'use server'
    const provider = String(formData.get('provider') || '');
    const value = (formData.get('value') as string) || '';
    if (!provider) return getSettingsOverview();
    setProviderKey(provider as any, value || null);
    return getSettingsOverview();
  }

  async function testApiKeyAction(prev: any, formData: FormData): Promise<{ provider: string; ok: boolean; message?: string }>{
    'use server'
    const provider = String(formData.get('provider') || '');
    const result = await validateProviderKey(provider as any);
    return { provider, ...result };
  }

  async function addMcpServerAction(prev: SettingsOverview, formData: FormData): Promise<SettingsOverview> {
    'use server'
    const name = String(formData.get('name') || '');
    const url = String(formData.get('url') || '');
    const apiKeyHeaderName = String(formData.get('apiKeyHeaderName') || 'Authorization');
    const apiKeyPrefix = String(formData.get('apiKeyPrefix') || 'Bearer');
    const apiKey = (formData.get('apiKey') as string) || undefined;
    if (!name || !url) {
      return getSettingsOverview();
    }
    addMcpServer({ name, url, apiKeyHeaderName, apiKeyPrefix, apiKey });
    return getSettingsOverview();
  }

  async function updateMcpServerAction(prev: SettingsOverview, formData: FormData): Promise<SettingsOverview> {
    'use server'
    const id = String(formData.get('id') || '');
    if (!id) return getSettingsOverview();
    const name = formData.get('name');
    const url = formData.get('url');
    const apiKeyHeaderName = formData.get('apiKeyHeaderName');
    const apiKeyPrefix = formData.get('apiKeyPrefix');
    const apiKeyRaw = formData.get('apiKey');
    const clearApiKey = formData.get('clearApiKey');
    const updates: any = {};
    if (typeof name === 'string') updates.name = name;
    if (typeof url === 'string') updates.url = url;
    if (typeof apiKeyHeaderName === 'string') updates.apiKeyHeaderName = apiKeyHeaderName;
    if (typeof apiKeyPrefix === 'string') updates.apiKeyPrefix = apiKeyPrefix;
    if (clearApiKey) updates.apiKey = null;
    else if (typeof apiKeyRaw === 'string' && apiKeyRaw) updates.apiKey = apiKeyRaw;
    updateMcpServer(id, updates);
    return getSettingsOverview();
  }

  async function removeMcpServerAction(prev: SettingsOverview, formData: FormData): Promise<SettingsOverview> {
    'use server'
    const id = String(formData.get('id') || '');
    if (!id) return getSettingsOverview();
    removeMcpServer(id);
    return getSettingsOverview();
  }

  return (
    <div style={{ maxWidth: 800, margin: '2rem auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>Settings</h1>
      <SettingsClient
        initial={initial}
        actions={{ saveApiKeyAction, testApiKeyAction, addMcpServerAction, updateMcpServerAction, removeMcpServerAction }}
      />
    </div>
  );
}
