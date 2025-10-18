'use server';

import { revalidatePath } from 'next/cache';

import {
  createCredential,
  deleteCredential,
  listCredentials,
  updateCredentialSecret,
  updateCredentialStatus,
} from '@/lib/credentials';
import {
  credentialProviderEnumValues,
  credentialStatusEnumValues,
} from '@/drizzle/schema';
import type { StoredCredential } from '@/lib/credentials';

type Provider = (typeof credentialProviderEnumValues)[number];
type Status = (typeof credentialStatusEnumValues)[number];

const providerSet = new Set<string>(credentialProviderEnumValues);
const statusSet = new Set<string>(credentialStatusEnumValues);

function assertProvider(value: FormDataEntryValue | null): Provider {
  const candidate = typeof value === 'string' ? value : '';
  if (!providerSet.has(candidate)) {
    throw new Error(`Unsupported provider "${candidate}"`);
  }
  return candidate as Provider;
}

function assertStatus(value: FormDataEntryValue | null): Status {
  const candidate = typeof value === 'string' ? value : '';
  if (!statusSet.has(candidate)) {
    throw new Error(`Unsupported status "${candidate}"`);
  }
  return candidate as Status;
}

export async function createCredentialAction(formData: FormData) {
  const provider = assertProvider(formData.get('provider'));
  const name = (formData.get('name') as string | null)?.trim() || provider.toUpperCase();
  const secret = (formData.get('secret') as string | null)?.trim();

  if (!secret) {
    throw new Error('Secret value is required');
  }

  await createCredential({ provider, name, secret });
  revalidatePath('/settings');
}

export async function rotateCredentialSecretAction(formData: FormData) {
  const id = (formData.get('credentialId') as string | null)?.trim();
  const secret = (formData.get('secret') as string | null)?.trim();

  if (!id) {
    throw new Error('Credential id is required');
  }
  if (!secret) {
    throw new Error('Secret value is required');
  }

  await updateCredentialSecret(id, secret);
  revalidatePath('/settings');
}

export async function deleteCredentialAction(formData: FormData) {
  const id = (formData.get('credentialId') as string | null)?.trim();
  if (!id) {
    throw new Error('Credential id is required');
  }
  await deleteCredential(id);
  revalidatePath('/settings');
}

export async function setCredentialStatusAction(formData: FormData) {
  const id = (formData.get('credentialId') as string | null)?.trim();
  const status = assertStatus(formData.get('status'));
  if (!id) {
    throw new Error('Credential id is required');
  }
  await updateCredentialStatus(id, status);
  revalidatePath('/settings');
}

export async function getCredentialList(): Promise<StoredCredential[]> {
  return listCredentials();
}

export type { StoredCredential };
