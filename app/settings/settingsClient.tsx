"use client";
import React, { useEffect, useMemo, useState, useTransition } from 'react';
import type { SettingsOverview } from '../../lib/secureSettings';
import { useActionState, useFormStatus } from 'react-dom';

type Actions = {
  saveApiKeyAction: (prev: SettingsOverview, formData: FormData) => Promise<SettingsOverview>;
  testApiKeyAction: (prev: any, formData: FormData) => Promise<{ provider: string; ok: boolean; message?: string }>;
  addMcpServerAction: (prev: SettingsOverview, formData: FormData) => Promise<SettingsOverview>;
  updateMcpServerAction: (prev: SettingsOverview, formData: FormData) => Promise<SettingsOverview>;
  removeMcpServerAction: (prev: SettingsOverview, formData: FormData) => Promise<SettingsOverview>;
};

function mask(v: string) {
  const last4 = v.slice(-4);
  return `••••••••••••${last4}`;
}

export default function SettingsClient({ initial, actions }: { initial: SettingsOverview; actions: Actions }) {
  const [settings, setSettings] = useState<SettingsOverview>(initial);

  const [saveKeyState, saveKeyAction] = useActionState(actions.saveApiKeyAction, initial);
  const [addMcpState, addMcpAction] = useActionState(actions.addMcpServerAction, initial);
  const [updateMcpState, updateMcpAction] = useActionState(actions.updateMcpServerAction, initial);
  const [removeMcpState, removeMcpAction] = useActionState(actions.removeMcpServerAction, initial);

  useEffect(() => setSettings(saveKeyState), [saveKeyState]);
  useEffect(() => setSettings(addMcpState), [addMcpState]);
  useEffect(() => setSettings(updateMcpState), [updateMcpState]);
  useEffect(() => setSettings(removeMcpState), [removeMcpState]);

  const [testing, setTesting] = useState<Record<string, { ok: boolean; message?: string } | undefined>>({});
  const [isPending, startTransition] = useTransition();

  const handleTestKey = (provider: 'openai' | 'espn' | 'cfbd') => {
    const fd = new FormData();
    fd.set('provider', provider);
    startTransition(async () => {
      const res = await actions.testApiKeyAction({}, fd);
      setTesting((prev) => ({ ...prev, [provider]: { ok: res.ok, message: res.message } }));
    });
  };

  const doPingServer = async (id: string) => {
    try {
      const res = await fetch('/api/mcp/ping', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ping failed');
      setSettings((prev) => ({
        ...prev,
        mcpServers: prev.mcpServers.map((s) => (s.id === id ? { ...s, lastStatus: { status: data.status, message: data.message, checkedAt: data.checkedAt } } : s)),
      }));
    } catch (e: any) {
      setSettings((prev) => ({
        ...prev,
        mcpServers: prev.mcpServers.map((s) => (s.id === id ? { ...s, lastStatus: { status: 'error', message: e?.message || 'Ping error', checkedAt: new Date().toISOString() } } : s)),
      }));
    }
  };

  return (
    <div>
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 'bold' }}>API Credentials</h2>
        <p style={{ color: '#555', marginTop: 4 }}>Credentials are encrypted at rest using a master key. Only masked values are shown.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, marginTop: 16 }}>
          <CredentialForm provider="openai" label="OpenAI API Key" masked={settings.openai.masked} onSubmit={saveKeyAction} onOptimistic={(value) => setSettings((s) => ({ ...s, openai: { ...s.openai, masked: value ? mask(value) : null } }))} onTest={() => handleTestKey('openai')} testing={testing.openai} />
          <CredentialForm provider="espn" label="ESPN API Key" masked={settings.espn.masked} onSubmit={saveKeyAction} onOptimistic={(value) => setSettings((s) => ({ ...s, espn: { ...s.espn, masked: value ? mask(value) : null } }))} onTest={() => handleTestKey('espn')} testing={testing.espn} />
          <CredentialForm provider="cfbd" label="CFBD API Key" masked={settings.cfbd.masked} onSubmit={saveKeyAction} onOptimistic={(value) => setSettings((s) => ({ ...s, cfbd: { ...s.cfbd, masked: value ? mask(value) : null } }))} onTest={() => handleTestKey('cfbd')} testing={testing.cfbd} />
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: 20, fontWeight: 'bold' }}>MCP Connections</h2>
        <p style={{ color: '#555', marginTop: 4 }}>Add, edit, remove MCP servers. Use Ping to validate connectivity.</p>
        <div style={{ border: '1px solid #ddd', padding: 16, borderRadius: 8, marginTop: 12 }}>
          <h3 style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>Add New Server</h3>
          <form action={addMcpAction} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <input name="name" placeholder="Name" required style={{ padding: 8 }} />
            <input name="url" placeholder="URL (https://example.com/health)" required style={{ padding: 8 }} />
            <input name="apiKeyHeaderName" placeholder="Header Name (default Authorization)" style={{ padding: 8 }} />
            <input name="apiKeyPrefix" placeholder="Header Prefix (default Bearer)" style={{ padding: 8 }} />
            <input name="apiKey" placeholder="API Key (optional)" style={{ padding: 8 }} />
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <SubmitButton label="Add" />
            </div>
          </form>
        </div>

        <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
          {settings.mcpServers.map((s) => (
            <div key={s.id} style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8 }}>
              <form action={updateMcpAction} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, alignItems: 'center' }}>
                <input type="hidden" name="id" value={s.id} />
                <input name="name" defaultValue={s.name} placeholder="Name" style={{ padding: 8 }} />
                <input name="url" defaultValue={s.url} placeholder="URL" style={{ padding: 8 }} />
                <input name="apiKeyHeaderName" defaultValue={s.apiKeyHeaderName || 'Authorization'} placeholder="Header Name" style={{ padding: 8 }} />
                <input name="apiKeyPrefix" defaultValue={s.apiKeyPrefix || 'Bearer'} placeholder="Header Prefix" style={{ padding: 8 }} />
                <input name="apiKey" placeholder={s.hasApiKey ? '•••••• (set to replace)' : 'API Key (optional)'} style={{ padding: 8 }} />
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <SubmitButton label="Save" />
                  {s.hasApiKey && (
                    <button formAction={updateMcpAction} name="clearApiKey" value="1" type="submit" style={{ padding: '8px 12px' }}>Clear Key</button>
                  )}
                  <button type="button" onClick={() => doPingServer(s.id)} style={{ padding: '8px 12px' }}>Ping</button>
                  <button formAction={removeMcpAction} name="id" value={s.id} type="submit" style={{ padding: '8px 12px', color: 'white', background: '#d9534f', border: 'none', borderRadius: 4 }}>Remove</button>
                </div>
              </form>
              <div style={{ fontSize: 12, color: '#555', marginTop: 6 }}>
                Status: {s.lastStatus?.status || 'unknown'} {s.lastStatus?.message ? `- ${s.lastStatus.message}` : ''}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function SubmitButton({ label }: { label: string }) {
  const status = useFormStatus();
  return (
    <button type="submit" disabled={status.pending} style={{ padding: '8px 12px' }}>
      {status.pending ? 'Working…' : label}
    </button>
  );
}

function CredentialForm({ provider, label, masked, onSubmit, onOptimistic, onTest, testing }: {
  provider: 'openai' | 'espn' | 'cfbd';
  label: string;
  masked: string | null;
  onSubmit: (formData: FormData) => void;
  onOptimistic?: (value: string | null) => void;
  onTest: () => void;
  testing?: { ok: boolean; message?: string };
}) {
  return (
    <div style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8 }}>
      <div style={{ fontWeight: 'bold' }}>{label}</div>
      <div style={{ fontSize: 12, color: '#555', marginBottom: 8 }}>Current: {masked ?? 'Not set'}</div>
      <form
        action={onSubmit}
        onSubmit={(e) => {
          try {
            const fd = new FormData(e.currentTarget as HTMLFormElement);
            const val = (fd.get('value') as string) || '';
            if (onOptimistic) onOptimistic(val || null);
          } catch {}
        }}
        style={{ display: 'flex', gap: 8, alignItems: 'center' }}
      >
        <input type="hidden" name="provider" value={provider} />
        <input name="value" placeholder="Enter new key" style={{ padding: 8, flex: 1 }} />
        <SubmitButton label="Save" />
        <button type="submit" name="value" value="" style={{ padding: '8px 12px' }}>Clear</button>
        <button type="button" onClick={onTest} style={{ padding: '8px 12px' }}>Test</button>
      </form>
      {testing && (
        <div style={{ marginTop: 6, fontSize: 12, color: testing.ok ? 'green' : 'red' }}>
          {testing.ok ? 'Connection OK' : `Validation failed: ${testing.message || ''}`}
        </div>
      )}
    </div>
  );
}
