/**
 * Smoke-test OpenAI-compatible brain path for one Neon employee.
 * Usage: node scripts/smoke-brain-stream.mjs [employeeId]
 */
import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';

config({ path: '.env', quiet: true });

const employeeId =
  process.argv[2] || 'a8a5fb9e-4c84-489f-9097-8245349b4348'; // Kaira

const sql = neon(process.env.DATABASE_URL);
const [runtime] = await sql`
  select de.name, de.role, er.brain_provider, er.system_prompt, er.temperature, er.max_tokens,
         epc.config->>'model' as model
  from digital_employee de
  left join employee_runtime er on er.employee_id = de.id
  left join employee_provider_config epc
    on epc.employee_id = de.id and epc.provider_type = 'brain'
  where de.id = ${employeeId}
  limit 1
`;

if (!runtime) {
  console.error('employee not found', employeeId);
  process.exit(1);
}

console.log('employee', runtime.name, runtime.brain_provider, runtime.model);

const provider = runtime.brain_provider || 'openai';
let baseUrl = 'https://api.openai.com/v1';
let apiKey = process.env.OPENAI_API_KEY;
let model = runtime.model || 'gpt-4.1-mini';

if (provider === 'nullxes') {
  baseUrl = (process.env.NULLXES_BRAIN_API_BASE_URL || '').replace(/\/$/, '');
  apiKey = process.env.NULLXES_BRAIN_API_KEY;
  model = process.env.NULLXES_BRAIN_MODEL || model;
} else if (provider === 'xai') {
  baseUrl = (process.env.XAI_API_BASE_URL || 'https://api.x.ai/v1').replace(/\/$/, '');
  apiKey = process.env.XAI_API_KEY;
}

const system = `You are ${runtime.name}, ${runtime.role} at NULLXES. Reply in one short Russian sentence.`;

const res = await fetch(`${baseUrl}/chat/completions`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model,
    temperature: 0.4,
    max_tokens: 80,
    stream: true,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: 'Привет. Кто ты?' },
    ],
  }),
});

console.log('status', res.status);
if (!res.ok) {
  console.error(await res.text());
  process.exit(1);
}

const reader = res.body.getReader();
const decoder = new TextDecoder();
let text = '';
let buf = '';
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  buf += decoder.decode(value, { stream: true });
  const lines = buf.split('\n');
  buf = lines.pop() ?? '';
  for (const line of lines) {
    if (!line.startsWith('data:')) continue;
    const payload = line.slice(5).trim();
    if (!payload || payload === '[DONE]') continue;
    try {
      const chunk = JSON.parse(payload);
      const c = chunk.choices?.[0]?.delta?.content;
      if (c) {
        text += c;
        process.stdout.write(c);
      }
    } catch {
      // ignore
    }
  }
}
console.log('\n---\nok chars=', text.length);
