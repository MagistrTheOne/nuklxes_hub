/**
 * Probe Anam slots: verify expected personaId + avatarId on each lab key.
 * Read-only. Secrets stay in .env.
 */
import { config } from 'dotenv';
config({ path: '.env' });

const BASE = (process.env.ANAM_API_BASE_URL || 'https://api.anam.ai/v1').replace(/\/$/, '');

const EXPECTED = [
  {
    name: 'Kaira NULLXES',
    slot: 'ANAM_API_KEY',
    avatarId: '4ac2afc2-ebcc-4643-b6ec-2c47b9c2e296',
    personaId: 'f1e1cb69-5c57-4276-b240-c829a2a9fd9f',
  },
  {
    name: 'Somnia',
    slot: 'ANAM_API_KEY',
    avatarId: '77ed30b8-4f40-4c58-9a9e-fe5b5eb6ffd3',
    personaId: '0e9ea820-e5a2-4257-9fa0-ed097caeb98e',
  },
  {
    name: 'ANNA MARIA NULLXES',
    slot: 'ANAM_API_KEY_2',
    avatarId: 'b2163ae1-aa94-40ab-b070-fa5fd40f5999',
    personaId: '81c24d31-ff69-4070-8397-81fdd6eece65',
  },
  {
    name: 'Megan NULLXES',
    slot: 'ANAM_API_KEY_4',
    avatarId: 'f968b9d7-e4cb-466b-a443-60a618bf8d66',
    personaId: 'da9e34e6-f601-4b97-a5ba-b98af2e63dfc',
  },
  {
    name: 'Akane Tsukiyama',
    slot: 'ANAM_API_KEY_5',
    avatarId: '3f2bc000-c321-47b0-8059-b918a6c5c5cf',
    personaId: '653e200a-f937-4541-a33b-dabc01f218c5',
  },
  {
    name: 'Yuki Naruka',
    slot: 'ANAM_API_KEY_6',
    avatarId: '61c82bf5-3d50-4987-9e72-a9c1bc0b6927',
    personaId: '8babea5d-9bfb-47c8-b954-05e6abe8f891',
  },
  {
    name: 'Evgenia Emelyanova',
    slot: 'ANAM_API_KEY_9',
    avatarId: '603b82ea-ab57-4c40-a1b2-5c29171dca1a',
    personaId: '96869f7a-8ee8-45ca-81f3-40adbddc777f',
  },
  {
    name: 'Adeline Kalen',
    slot: 'ANAM_API_KEY_11',
    avatarId: '7689f5fd-3aec-496b-baa9-6f585aee0260',
    personaId: '0644210c-9fcf-4815-ad95-51d856e17a51',
  },
];

async function getJson(path, key) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  const json = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, json };
}

async function listAll(path, key) {
  const items = [];
  let page = 1;
  while (page <= 10) {
    const { ok, json } = await getJson(`${path}?perPage=100&page=${page}`, key);
    if (!ok) return { error: true, items };
    const batch = json?.data ?? [];
    items.push(...batch);
    const last = json?.meta?.lastPage ?? json?.meta?.last_page ?? 1;
    if (page >= last || batch.length === 0) break;
    page++;
  }
  return { error: false, items };
}

const slots = [
  'ANAM_API_KEY',
  'ANAM_API_KEY_2',
  'ANAM_API_KEY_3',
  'ANAM_API_KEY_4',
  'ANAM_API_KEY_5',
  'ANAM_API_KEY_6',
  'ANAM_API_KEY_7',
  'ANAM_API_KEY_8',
  'ANAM_API_KEY_9',
  'ANAM_API_KEY_10',
  'ANAM_API_KEY_11',
  'ANAM_API_KEY_15',
];

console.log('base', BASE);
console.log('\n## SLOT KEYS');
for (const slot of slots) {
  const key = process.env[slot]?.trim();
  if (!key) {
    console.log(`${slot}: EMPTY`);
    continue;
  }
  const personas = await listAll('/personas', key);
  const names = (personas.items || [])
    .map((p) => p.name || '?')
    .filter((n, i, a) => a.indexOf(n) === i)
    .join(', ');
  console.log(
    `${slot}: ok personas=${personas.items?.length ?? 0}${names ? ` (${names})` : ''}${personas.error ? ' ERR' : ''}`,
  );
}

console.log('\n## EXPECTED PERSONA / AVATAR');
let pass = 0;
let fail = 0;
for (const row of EXPECTED) {
  const key = process.env[row.slot]?.trim();
  if (!key) {
    console.log(`FAIL ${row.name} | ${row.slot} missing`);
    fail++;
    continue;
  }

  const persona = await getJson(`/personas/${row.personaId}`, key);
  const avatar = await getJson(`/avatars/${row.avatarId}`, key);

  const personaOk = persona.ok;
  const avatarOk = avatar.ok;
  const personaName = persona.json?.name ?? persona.json?.data?.name ?? null;

  // also confirm listed on slot
  const listed = await listAll('/personas', key);
  const inList = (listed.items || []).some((p) => (p.id || p.personaId) === row.personaId);

  const ok = personaOk && avatarOk && inList;
  if (ok) pass++;
  else fail++;

  console.log(
    `${ok ? 'OK' : 'FAIL'} ${row.name} | ${row.slot}` +
      ` | persona=${personaOk ? 'yes' : `no(${persona.status})`}` +
      ` | avatar=${avatarOk ? 'yes' : `no(${avatar.status})`}` +
      ` | listed=${inList}` +
      (personaName ? ` | name=${personaName}` : ''),
  );
}

console.log(`\nresult pass=${pass} fail=${fail}`);
process.exit(fail ? 1 : 0);
