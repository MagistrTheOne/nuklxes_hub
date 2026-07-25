import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import { Platform, Text, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { resolveAnamBridgeUrl } from '@/features/anam/bridge/anam-bridge-url';
import type {
  AnamBridgeHandle,
  BridgeToRnMessage,
  RnToBridgeMessage,
} from '@/features/anam/bridge/protocol';

type PersonaStageProps = {
  className?: string;
  onBridgeMessage?: (message: BridgeToRnMessage) => void;
};

/**
 * Native Anam face plane — WebView hosts @anam-ai/js-sdk (web-first).
 * Requires Dev Client + EXPO_PUBLIC_API_URL serving /api/v1/anam/bridge.
 */
export const PersonaStage = forwardRef<AnamBridgeHandle | null, PersonaStageProps>(
  function PersonaStage({ className, onBridgeMessage }, ref) {
    const webRef = useRef<WebView>(null);
    const readyRef = useRef(false);
    const queueRef = useRef<RnToBridgeMessage[]>([]);

    const post = useCallback((message: RnToBridgeMessage) => {
      if (!readyRef.current) {
        queueRef.current.push(message);
        return;
      }
      const payload = JSON.stringify(message);
      webRef.current?.postMessage(payload);
      // Also inject for Android reliability
      webRef.current?.injectJavaScript(
        `window.dispatchEvent(new MessageEvent('message',{data:${JSON.stringify(payload)}}));true;`,
      );
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        start: (sessionToken: string) => post({ type: 'start', sessionToken }),
        stop: () => post({ type: 'stop' }),
        sendText: (content: string) => post({ type: 'sendText', content }),
        speak: (content: string, correlationId?: string) =>
          post({ type: 'speak', content, correlationId }),
        playPcm: (pcmBase64: string) => post({ type: 'playPcm', pcmBase64 }),
        interrupt: () => post({ type: 'interrupt' }),
      }),
      [post],
    );

    const onMessage = (event: WebViewMessageEvent) => {
      try {
        const message = JSON.parse(event.nativeEvent.data) as BridgeToRnMessage;
        if (message.type === 'ready' || (message.type === 'status' && message.status === 'ready')) {
          readyRef.current = true;
          const queued = queueRef.current;
          queueRef.current = [];
          for (const item of queued) post(item);
        }
        onBridgeMessage?.(message);
      } catch {
        // ignore malformed
      }
    };

    useEffect(() => {
      return () => {
        readyRef.current = false;
        queueRef.current = [];
      };
    }, []);

    if (Platform.OS === 'web') {
      return null;
    }

    let bridgeUrl: string | null = null;
    try {
      bridgeUrl = resolveAnamBridgeUrl();
    } catch {
      bridgeUrl = null;
    }

    if (!bridgeUrl) {
      return (
        <View
          className={`items-center justify-center rounded-2xl border border-dashed border-white/15 bg-[#0B0B0B] px-6 py-16 ${className ?? ''}`}>
          <Text className="text-center text-[14px] text-white/40">
            Set EXPO_PUBLIC_API_URL for Anam WebView bridge
          </Text>
        </View>
      );
    }

    return (
      <View
        className={`overflow-hidden rounded-2xl border border-white/10 bg-[#050505] ${className ?? ''}`}
        style={{ minHeight: 320 }}>
        <WebView
          ref={webRef}
          source={{ uri: bridgeUrl }}
          onMessage={onMessage}
          style={{ flex: 1, backgroundColor: '#050505', minHeight: 320 }}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled
          domStorageEnabled
          mediaCapturePermissionGrantType="grant"
          allowsFullscreenVideo
          originWhitelist={['*']}
          mixedContentMode="always"
          setSupportMultipleWindows={false}
        />
      </View>
    );
  },
);
