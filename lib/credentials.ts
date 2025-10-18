import { desc, eq } from 'drizzle-orm';

import {
  appCredentials,
  credentialProviderEnumValues,
  credentialStatusEnumValues,
} from '@/drizzle/schema';
import { db } from '@/lib/db';
import {
  decryptSecret,
  encryptSecret,
  maskSecret,
  type EncryptedSecret,
} from '@/lib/security/crypto';

type Provider = (typeof credentialProviderEnumValues)[number];
type Status = (typeof credentialStatusEnumValues)[number];

type CredentialRow = typeof appCredentials.$inferSelect;

export interface StoredCredential {
  id: string;
  provider: Provider;
  name: string;
  status: Status;
  lastValidatedAt: Date | null;
  maskedSecret: string;
}

function toEncryptedSecret(row: CredentialRow): EncryptedSecret {
  return {
    ciphertext: Buffer.from(row.secretCiphertext, 'base64'),
    iv: Buffer.from(row.secretIv, 'base64'),
    tag: Buffer.from(row.secretTag, 'base64'),
  };
}

export async function listCredentials(): Promise<StoredCredential[]> {
  const rows = await db
    .select()
    .from(appCredentials)
    .orderBy(desc(appCredentials.createdAt));

  return rows.map((row) => {
    const secret = decryptSecret(toEncryptedSecret(row));
    return {
      id: row.id,
      provider: row.provider,
      name: row.name,
      status: row.status,
      lastValidatedAt: row.lastValidatedAt,
      maskedSecret: maskSecret(secret),
    };
  });
}

export async function createCredential(input: {
  provider: Provider;
  name: string;
  secret: string;
}): Promise<string> {
  const encrypted = encryptSecret(input.secret);
  const [row] = await db
    .insert(appCredentials)
    .values({
      provider: input.provider,
      name: input.name,
      secretCiphertext: encrypted.ciphertext.toString('base64'),
      secretIv: encrypted.iv.toString('base64'),
      secretTag: encrypted.tag.toString('base64'),
    })
    .returning({ id: appCredentials.id });

  return row.id;
}

export async function updateCredentialSecret(
  id: string,
  secret: string,
  status: Status = 'unknown',
) {
  const encrypted = encryptSecret(secret);
  await db
    .update(appCredentials)
    .set({
      secretCiphertext: encrypted.ciphertext.toString('base64'),
      secretIv: encrypted.iv.toString('base64'),
      secretTag: encrypted.tag.toString('base64'),
      updatedAt: new Date(),
      status,
    })
    .where(eq(appCredentials.id, id));
}

export async function updateCredentialStatus(id: string, status: Status) {
  await db
    .update(appCredentials)
    .set({
      status,
      lastValidatedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(appCredentials.id, id));
}

export async function deleteCredential(id: string) {
  await db.delete(appCredentials).where(eq(appCredentials.id, id));
}

export async function getCredentialSecretById(id: string): Promise<string | null> {
  const row = await db.query.appCredentials.findFirst({
    where(fields, { eq }) {
      return eq(fields.id, id);
    },
  });

  if (!row) return null;
  return decryptSecret(toEncryptedSecret(row));
}

export async function getCredentialSecretByProvider(
  provider: Provider,
): Promise<{ id: string; secret: string } | null> {
  const row = await db.query.appCredentials.findFirst({
    where(fields, { eq }) {
      return eq(fields.provider, provider);
    },
  });
  if (!row) return null;
  return { id: row.id, secret: decryptSecret(toEncryptedSecret(row)) };
}
