import { createSign } from 'node:crypto';

const AUTH_URL = 'https://public-api.rustore.ru/public/auth/';

/**
 * RuStore Console API auth (publish / console automation).
 * Uses RSA private key from RuStore Console — never ship this to the mobile app.
 *
 * Docs: https://www.rustore.ru/help/work-with-rustore-api/api-authorization-token
 */
export async function getRustoreAuthToken(): Promise<string> {
  const keyId = process.env.RUSTORE_API_KEY_ID?.trim();
  const privateKeyB64 = process.env.RUSTORE_API_PRIVATE_KEY?.trim();

  if (!keyId || !privateKeyB64) {
    throw new Error(
      'Set RUSTORE_API_KEY_ID and RUSTORE_API_PRIVATE_KEY (server-only)',
    );
  }

  const timestamp = formatRustoreTimestamp(new Date());
  const message = `${keyId}${timestamp}`;

  // SHA512withRSA: hash message with SHA-512, then RSA-sign (Node Sign does both)
  const pem = toPkcs8Pem(privateKeyB64);
  const signer = createSign('RSA-SHA512');
  signer.update(message, 'utf8');
  signer.end();
  const signature = signer.sign(pem).toString('base64');

  const response = await fetch(AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keyId, timestamp, signature }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`RuStore auth failed (${response.status}): ${body}`);
  }

  const json = (await response.json()) as {
    body?: { jwe?: string };
    jwe?: string;
  };

  const jwe = json.body?.jwe ?? json.jwe;
  if (!jwe) {
    throw new Error('RuStore auth response missing jwe token');
  }

  return jwe;
}

function formatRustoreTimestamp(date: Date): string {
  const pad = (n: number, w = 2) => String(n).padStart(w, '0');
  const offsetMin = -date.getTimezoneOffset();
  const sign = offsetMin >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMin);
  const oh = pad(Math.floor(abs / 60));
  const om = pad(abs % 60);

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}${sign}${oh}:${om}`;
}

function toPkcs8Pem(base64Key: string): string {
  const cleaned = base64Key.replace(/-----BEGIN [^-]+-----/g, '').replace(/-----END [^-]+-----/g, '').replace(/\s+/g, '');
  const lines = cleaned.match(/.{1,64}/g) ?? [cleaned];
  return `-----BEGIN PRIVATE KEY-----\n${lines.join('\n')}\n-----END PRIVATE KEY-----`;
}
