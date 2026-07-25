/**
 * HTML host for Anam JS SDK inside React Native WebView.
 * Loads UMD from Hub /api/v1/anam/bridge-sdk (same origin as page).
 */

export function buildAnamBridgeHtml(sdkUrl: string): string {
  const safeSdkUrl = sdkUrl.replace(/"/g, '&quot;');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <style>
    html, body { margin: 0; width: 100%; height: 100%; background: #050505; overflow: hidden; }
    #nullxes-anam-persona-video {
      width: 100%; height: 100%; object-fit: cover; background: #050505;
    }
  </style>
</head>
<body>
  <video id="nullxes-anam-persona-video" autoplay playsinline muted></video>
  <script src="${safeSdkUrl}"></script>
  <script>
(function () {
  var VIDEO_ID = 'nullxes-anam-persona-video';
  var client = null;
  var lastUserContent = '';

  function post(payload) {
    try {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify(payload));
      }
    } catch (e) {}
  }

  function getCreateClient() {
    var ns = window.anam || window.Anam || {};
    return ns.createClient || (ns.default && ns.default.createClient) || null;
  }

  function base64ToUint8Array(b64) {
    var binary = atob(b64);
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  async function start(sessionToken) {
    var createClient = getCreateClient();
    if (!createClient) {
      post({ type: 'status', status: 'error', error: 'Anam SDK createClient missing' });
      return;
    }
    post({ type: 'status', status: 'connecting' });
    try {
      if (client) {
        try { await client.stopStreaming(); } catch (e) {}
        client = null;
      }
      client = createClient(sessionToken);
      if (client.addListener) {
        client.addListener('MESSAGE_HISTORY_UPDATED', function (history) {
          if (!history || !history.length) return;
          var last = history[history.length - 1];
          var role = String(last.role || '').toLowerCase();
          var content = (last.content || '').trim();
          if (role !== 'user' || !content || content === lastUserContent) return;
          lastUserContent = content;
          post({
            type: 'userMessage',
            content: content,
            history: history.map(function (m) {
              return { role: m.role, content: m.content };
            }),
          });
        });
      }
      await client.streamToVideoElement(VIDEO_ID);
      // Unmute after stream so autoplay policies don't block start.
      try {
        var video = document.getElementById(VIDEO_ID);
        if (video) { video.muted = false; }
      } catch (e) {}
      post({ type: 'status', status: 'connected' });
    } catch (err) {
      post({
        type: 'status',
        status: 'error',
        error: err && err.message ? err.message : 'Failed to start Anam stream',
      });
    }
  }

  async function stop() {
    try {
      if (client && client.stopStreaming) await client.stopStreaming();
    } catch (e) {}
    client = null;
    lastUserContent = '';
    post({ type: 'status', status: 'idle' });
  }

  function sendText(content) {
    if (!client || !client.sendUserMessage) return;
    client.sendUserMessage(String(content || ''));
  }

  async function speak(content, correlationId) {
    if (!client) return;
    var text = String(content || '').trim();
    if (!text) return;
    try {
      if (client.createTalkMessageStream) {
        var stream = client.createTalkMessageStream(correlationId);
        var parts = text.split(/(\\s+)/).filter(Boolean);
        for (var i = 0; i < parts.length; i++) {
          if (!stream.isActive()) break;
          await stream.streamMessageChunk(parts[i], false);
        }
        if (stream.isActive()) await stream.endMessage();
      } else if (client.talk) {
        await client.talk(text);
      }
    } catch (err) {
      post({ type: 'error', error: err && err.message ? err.message : 'speak failed' });
    }
  }

  function playPcm(pcmBase64) {
    if (!client || !client.createAgentAudioInputStream) {
      post({ type: 'error', error: 'Anam audio input stream unavailable' });
      return;
    }
    try {
      var audio = client.createAgentAudioInputStream({
        encoding: 'pcm_s16le',
        sampleRate: 16000,
        channels: 1,
      });
      var bytes = base64ToUint8Array(pcmBase64);
      var chunk = 4096;
      for (var offset = 0; offset < bytes.length; offset += chunk) {
        audio.sendAudioChunk(bytes.subarray(offset, offset + chunk));
      }
      audio.endSequence();
    } catch (err) {
      post({ type: 'error', error: err && err.message ? err.message : 'playPcm failed' });
    }
  }

  function interrupt() {
    try { if (client && client.interruptPersona) client.interruptPersona(); } catch (e) {}
  }

  function onHostMessage(raw) {
    var data = null;
    try {
      data = typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch (e) { return; }
    if (!data || !data.type) return;
    if (data.type === 'start') start(data.sessionToken);
    else if (data.type === 'stop') stop();
    else if (data.type === 'sendText') sendText(data.content);
    else if (data.type === 'speak') speak(data.content, data.correlationId);
    else if (data.type === 'playPcm') playPcm(data.pcmBase64);
    else if (data.type === 'interrupt') interrupt();
  }

  document.addEventListener('message', function (e) { onHostMessage(e.data); });
  window.addEventListener('message', function (e) { onHostMessage(e.data); });

  post({ type: 'ready' });
  post({ type: 'status', status: 'ready' });
})();
  </script>
</body>
</html>`;
}
