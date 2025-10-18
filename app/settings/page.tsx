import React from 'react';

import {
  createCredentialAction,
  deleteCredentialAction,
  getCredentialList,
  rotateCredentialSecretAction,
  setCredentialStatusAction,
} from './actions';
import {
  credentialProviderEnumValues,
  credentialStatusEnumValues,
} from '@/drizzle/schema';
import type { StoredCredential } from './actions';

export default async function SettingsPage() {
  let credentials: StoredCredential[] = [];
  let loadError: string | null = null;

  try {
    credentials = await getCredentialList();
  } catch (error) {
    loadError =
      error instanceof Error
        ? error.message
        : 'Unable to load credentials from the database.';
  }

  return (
    <div className="mx-auto my-8 flex max-w-xl flex-col gap-8">
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-900">API Credentials</h1>
        <p className="mt-2 text-sm text-gray-600">
          Store provider keys securely. Secrets are encrypted at rest and only decrypted on the server when required.
        </p>
        <form
          action={createCredentialAction}
          className="mt-6 space-y-4"
        >
          <label className="flex flex-col text-sm font-medium text-gray-700">
            Provider
            <select
              name="provider"
              className="mt-1 rounded border border-gray-300 bg-white p-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              defaultValue={credentialProviderEnumValues[0]}
            >
              {credentialProviderEnumValues.map((provider) => (
                <option key={provider} value={provider}>
                  {provider.toUpperCase()}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col text-sm font-medium text-gray-700">
            Display Name
            <input
              name="name"
              placeholder="e.g. OpenAI Prod"
              className="mt-1 rounded border border-gray-300 p-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>

          <label className="flex flex-col text-sm font-medium text-gray-700">
            Secret
            <input
              name="secret"
              placeholder="sk-..."
              className="mt-1 rounded border border-gray-300 p-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              required
            />
          </label>

          <button
            type="submit"
            className="w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-300 sm:w-auto"
          >
            Save Credential
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">Stored Credentials</h2>
        <p className="mt-2 text-sm text-gray-600">
          Rotate secrets and manage status updates as validations occur.
        </p>

        {loadError ? (
          <p className="mt-4 rounded border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-900">
            {loadError}
          </p>
        ) : credentials.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">No credentials saved yet.</p>
        ) : (
          <ul className="mt-6 space-y-5">
            {credentials.map((cred) => (
              <li
                key={cred.id}
                className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4 shadow-sm"
              >
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-semibold text-gray-900">
                    {cred.name} ({cred.provider.toUpperCase()})
                  </p>
                  <p className="text-xs text-gray-500">
                    Secret: {cred.maskedSecret || 'Not set'}
                  </p>
                </div>

                <div className="space-y-3">
                  <form
                    action={rotateCredentialSecretAction}
                    className="space-y-2"
                  >
                    <input type="hidden" name="credentialId" value={cred.id} />
                    <label className="flex flex-col text-sm font-medium text-gray-700">
                      Rotate Secret
                      <input
                        name="secret"
                        placeholder="New secret value"
                        className="mt-1 rounded border border-gray-300 p-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        required
                      />
                    </label>
                    <button
                      type="submit"
                      className="rounded bg-blue-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    >
                      Update Secret
                    </button>
                  </form>

                  <form
                    action={setCredentialStatusAction}
                    className="space-y-2"
                  >
                    <input type="hidden" name="credentialId" value={cred.id} />
                    <label className="flex flex-col text-sm font-medium text-gray-700">
                      Status
                      <select
                        name="status"
                        defaultValue={cred.status}
                        className="mt-1 rounded border border-gray-300 bg-white p-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      >
                        {credentialStatusEnumValues.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      type="submit"
                      className="rounded border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-700 transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-gray-200"
                    >
                      Update Status
                    </button>
                  </form>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-gray-500">
                    Last validated:{' '}
                    {cred.lastValidatedAt
                      ? cred.lastValidatedAt.toLocaleString()
                      : 'never'}
                  </p>
                  <form action={deleteCredentialAction}>
                    <input type="hidden" name="credentialId" value={cred.id} />
                    <button
                      type="submit"
                      className="rounded border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-200"
                    >
                      Remove
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
