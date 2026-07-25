# NULLXES Hub (Expo 57) — как стыковать с платформой

Platform repo: dplatform → https://www.nullxesdai.online  
Shared with web: **только Neon DB** (workforce / avatars / persona IDs). Schema owner = dplatform.  
Всё остальное (мозг, Talk, Chat UI, Anam mint, EL PCM) — **внутри Hub**.

Product idea: Digital Employee = лицо (Anam) + мозг (Hub brain-stream) + голос (ElevenLabs PCM → рот Anam; опционально Anam TTS).

Анам не думает. `llmId` у persona = external. Cognition всегда наша.

## Auth

- **Только Clerk.** Better Auth / platform session exchange — **не делаем**.
- Hub BFF валидирует Clerk JWT. `/me` — link по email к Neon `user` (read), без Better Auth cookie.

## Архитектура (не ломать)

```
User speech / text
  → (optional) Anam STT
  → POST Hub /api/v1/talk/brain-stream   ← МОЗГ (Clerk)
  → NDJSON tokens
  → voiceMode=elevenlabs (default): ElevenLabs PCM → Anam mouth/lipsync
  → voiceMode=anam:                 Anam speak/TTS + face
  → Anam video plane (лицо)
```

Параллельно:

- **Stream Chat** — синхронизация истории/тредов (как на вебе). Cognition и губы — не через Chat SDK.
- **Chat UI** — свои кнопки / кастомная оболочка поверх Stream (не дефолтный Stream chrome).
- **xAI Adeline** — отдельный Grok Voice sheet (`/xai-adeline`). Не смешивать с Anam Talk.

## SDK

| SDK | Ставить? | Зачем |
|---|---|---|
| Stream Chat | **Да** | Синхронизация истории с вебом. Кастомный UI / свои кнопки. |
| Stream Video | **Нет** | Live-лицо = Anam. Второй video plane = конфликт. |
| `@elevenlabs/react-native` Conversational Agent | **Нет** | EL = TTS PCM в Anam, не Agent WebRTC. |
| `@anam-ai/js-sdk` | **Да (web)** | Уже в deps. Android — native/WebView bridge. |
| `@elevenlabs/elevenlabs-js` | **Да (Hub BFF)** | Preview TTS уже есть; live PCM → рот — через Hub server. |

**Правило:** один realtime video owner = Anam. Chat SDK = текст/история. Voice = ElevenLabs (уже).

## Что уже есть у Hub

- Clerk auth
- Neon sync (read workforce) — аватары / persona / slots синхронизированы, `anamReady` = 8/8
- Talk bootstrap → `{ sessionId, sessionToken, voiceMode }`
- Anam keys/slots + web Live
- ElevenLabs voices + TTS preview (`voiceMode=elevenlabs` в каталоге)
- Не `db:push` / migrations на shared Neon

## Мозг (brain-stream) — в Hub

```
POST /api/v1/talk/brain-stream
Auth: Clerk JWT
Body: { employeeId, sessionId?, messages: [{ role, content }] }
Last message MUST be role=user
Response: NDJSON stream chunks
```

Контракт/промпт-слои — как в dplatform (референс), реализация в Hub:

1. NULLXES wrapper (если nullxes brain)
2. Identity / role
3. Character blueprint
4. Skills
5. RAG knowledge
6. Scenario overlay

Клиент только шлёт историю + `employeeId` / `sessionId`. Слои не дублировать на клиенте.

Платформенный `https://www.nullxesdai.online/api/talk/brain-stream` — референс, не runtime dependency для Hub.

## Talk bootstrap (уже есть)

```
POST /api/v1/talk/session → { sessionId, sessionToken, voiceMode }
```

- `sessionToken` → Anam player
- `voiceMode`: default **elevenlabs** (каталог уже так); `anam` — fallback TTS лица
- Секреты Anam/EL в Hub server env (MVP); на прод — не в клиентский бинарник

## Очередь работ

1. **Hub brain-stream** — ✅ `POST /api/v1/talk/brain-stream` (Clerk + Neon `employee_runtime` + NDJSON). Client: `streamTalkBrain`.
2. **Web Live pipeline** — ✅ STT/text → brain → EL PCM (`/api/v1/elevenlabs/pcm`) → Anam mouth; fallback Anam TTS.
3. **Polish** — reuse Talk `sessionToken` on Live (optional), interrupt UX, longer history.
4. **Stream Chat** — ✅ mint `/api/v1/chat/session`, bot `/api/v1/chat/bot-message`, tab Chat (custom UI). No Stream Video.
5. **Android native Anam** — ✅ WebView bridge (`/api/v1/anam/bridge` + UMD SDK). RN mints token + brain/PCM; WebView = face/mouth. Dev Client recommended for WebRTC.
6. **xAI Adeline** — ✅ `POST /api/v1/xai-voice/session` + `/xai-adeline` (web mic↔PCM; native stub). Console-bound agent; not Anam.

## Чего не делать

- Better Auth / Clerk↔Better Auth bridge
- Вторая БД / свои migrations на Neon
- Stream Video «поверх» Anam
- EL Conversational Agent как замена Talk
- Cognize внутри Anam persona
- Дублировать prompt layers на клиенте
- Дефолтный Stream Chat chrome без кастомизации кнопок

## Референсы в dplatform

- Talk brief: `docs/AGENT_TALK_2026-07-05.md`
- Mobile brief: `docs/AGENT_MOBILE_CLIENT_2026-07-04.md`
- Voice pipeline: `src/features/runtime-session/lib/attach-talk-voice-pipeline.ts`
- Brain route: `src/app/api/talk/brain-stream/route.ts`
- Session mint: `src/features/runtime-session/actions/employee-session.ts`

## TL;DR

- Anam = лицо. Hub brain-stream = мозг (Clerk). ElevenLabs = голос в рот Anam.
- Neon shared = workforce/avatars. Остальное в мобилке.
- Stream Chat = sync истории + кастомный UI. Stream Video = нет.
- Better Auth = нет. xAI Adeline = отдельный Grok Voice (не Anam).

**Очередь закрыта (v1 bridge).** Polish: interrupt UX, longer history, native Adeline audio.
