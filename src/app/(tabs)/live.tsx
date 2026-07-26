import { useUser } from '@clerk/expo';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Mic, MicOff, Phone, Play } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PersonaStage } from '@/features/anam/components/persona-stage';
import { usePersonaSession } from '@/features/anam/hooks/use-persona-session';
import type { TalkVoiceMode } from '@/features/talk';
import { DEFAULT_EMPLOYEE_ID } from '@/features/workforce/data/employees';
import { preferredEmployeeIdForEmail } from '@/features/workforce/data/org-defaults';
import { useEmployees } from '@/features/workforce/hooks/use-employees';
import { employeeAvailable } from '@/features/workforce/lib/product-status';

function resolveVoiceMode(
  talkVoiceMode: string | undefined,
  employeeMode: TalkVoiceMode | undefined,
): TalkVoiceMode {
  if (talkVoiceMode === 'anam' || talkVoiceMode === 'elevenlabs') {
    return talkVoiceMode;
  }
  return employeeMode ?? 'elevenlabs';
}

function formatElapsed(seconds: number) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${m}:${s}`;
}

export default function LiveScreen() {
  const router = useRouter();
  const {
    employeeId: paramId,
    talkSessionId,
    voiceMode: talkVoiceMode,
  } = useLocalSearchParams<{
    employeeId?: string;
    talkSessionId?: string;
    voiceMode?: string;
  }>();
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? null;
  const { data: employees = [] } = useEmployees();
  const ready = useMemo(
    () => employees.filter((e) => employeeAvailable(e)),
    [employees],
  );

  const resolveId = (id?: string) => {
    if (typeof id === 'string' && ready.some((e) => e.id === id)) return id;
    const preferred = preferredEmployeeIdForEmail(email);
    if (preferred && ready.some((e) => e.id === preferred)) return preferred;
    if (ready.some((e) => e.id === DEFAULT_EMPLOYEE_ID)) return DEFAULT_EMPLOYEE_ID;
    return ready[0]?.id ?? DEFAULT_EMPLOYEE_ID;
  };

  const [selectedId, setSelectedId] = useState(() => resolveId(paramId));
  const readyIds = ready.map((e) => e.id).join(',');
  const [elapsed, setElapsed] = useState(0);
  const connectedAtRef = useRef<number | null>(null);

  useEffect(() => {
    setSelectedId(resolveId(paramId));
  }, [paramId, readyIds, email]);

  const employee = useMemo(
    () => employees.find((e) => e.id === selectedId) ?? null,
    [employees, selectedId],
  );

  const voiceMode = resolveVoiceMode(
    typeof talkVoiceMode === 'string' ? talkVoiceMode : undefined,
    employee?.voiceMode,
  );

  const {
    status,
    pipelineState,
    error,
    micEnabled,
    setMicEnabled,
    start,
    stop,
    isNativeBridge,
    bridgeRef,
    onBridgeMessage,
  } = usePersonaSession({
    employeeId: selectedId,
    talkSessionId: typeof talkSessionId === 'string' ? talkSessionId : undefined,
    voiceMode,
    voiceId: employee?.voiceId,
    enableTalkPipeline: true,
    startMicMuted: true,
  });

  const connected = status === 'connected';
  const busy = status === 'minting' || status === 'connecting';
  const displayName = employee?.name ?? 'Assistant';

  useEffect(() => {
    if (!connected) {
      connectedAtRef.current = null;
      setElapsed(0);
      return;
    }
    connectedAtRef.current = Date.now();
    const id = setInterval(() => {
      if (!connectedAtRef.current) return;
      setElapsed(Math.floor((Date.now() - connectedAtRef.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [connected]);

  const statusHint = busy
    ? 'Connecting…'
    : connected
      ? pipelineState === 'thinking'
        ? 'Thinking…'
        : pipelineState === 'speaking'
          ? 'Speaking…'
          : 'Live'
      : 'Press Start session';

  return (
    <View className="flex-1 bg-[#050505]">
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        {/* Top chrome */}
        <View className="z-10 flex-row items-center justify-between px-4 pb-2 pt-1">
          <View className="min-w-0 flex-1 flex-row items-center">
            <Pressable
              onPress={() => {
                if (connected || busy) void stop();
                if (router.canGoBack()) router.back();
                else router.replace('/(tabs)/chat' as Href);
              }}
              className="mr-2 h-10 w-10 items-center justify-center active:opacity-70">
              <ArrowLeft size={22} color="#FFFFFF" />
            </Pressable>
            <Text className="flex-1 text-[17px] font-semibold text-white" numberOfLines={1}>
              {displayName}
            </Text>
          </View>
          {connected ? (
            <View className="flex-row items-center gap-2">
              <View className="flex-row items-center rounded-full bg-black/40 px-2.5 py-1">
                <View className="mr-1.5 h-2 w-2 rounded-full bg-[#FF3B30]" />
                <Text className="text-[11px] font-semibold tracking-[0.8px] text-white">
                  LIVE
                </Text>
              </View>
              <Text className="text-[13px] text-white/55">{formatElapsed(elapsed)}</Text>
            </View>
          ) : (
            <Text className="text-[13px] text-white/40">{statusHint}</Text>
          )}
        </View>

        {!connected ? (
          <View className="mx-4 mb-2 flex-row flex-wrap gap-2">
            {ready.slice(0, 6).map((item) => {
              const active = item.id === selectedId;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => {
                    if (status === 'error') void stop();
                    setSelectedId(item.id);
                  }}
                  className={`h-8 items-center justify-center rounded-full px-3 ${
                    active ? 'bg-white' : 'border border-white/15'
                  }`}>
                  <Text
                    className={`text-[12px] font-medium ${
                      active ? 'text-[#050505]' : 'text-white/65'
                    }`}>
                    {item.name.split(/\s+/)[0]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {/* Stage — Anam fills only after Start; no fake photo */}
        <View className="relative mx-0 flex-1 overflow-hidden bg-[#050505]">
          <View className="absolute inset-0">
            {isNativeBridge ? (
              <PersonaStage
                ref={bridgeRef}
                fill
                onBridgeMessage={onBridgeMessage}
                className="h-full w-full"
              />
            ) : (
              <PersonaStage fill className="h-full w-full" />
            )}
          </View>

          {!connected ? (
            <View className="absolute inset-0 items-center justify-center bg-[#050505]/92 px-8">
              <Text className="text-center text-[22px] font-semibold text-white">
                {displayName.split(/\s+/)[0]}
              </Text>
              <Text className="mt-2 text-center text-[14px] text-white/40">
                Avatar loads after you start the session
              </Text>
              {error ? (
                <Text className="mt-4 text-center text-[13px] text-red-400">{error}</Text>
              ) : null}
              <Pressable
                onPress={() => void start()}
                disabled={busy}
                className="mt-8 h-14 min-w-[200px] flex-row items-center justify-center rounded-full bg-white px-8 active:opacity-90 disabled:opacity-45">
                {busy ? (
                  <Text className="text-[16px] font-semibold text-[#050505]">Connecting…</Text>
                ) : (
                  <>
                    <Play size={18} color="#050505" fill="#050505" />
                    <Text className="ml-2 text-[16px] font-semibold text-[#050505]">
                      Start session
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          ) : null}

          {connected ? (
            <View className="absolute inset-x-0 bottom-0 items-center pb-8 pt-20">
              {error ? (
                <Text className="mb-3 px-4 text-center text-[13px] text-red-400">{error}</Text>
              ) : null}
              <View className="flex-row items-center gap-5 rounded-full border border-white/10 bg-black/55 px-5 py-3">
                <Pressable
                  onPress={() => setMicEnabled(!micEnabled)}
                  className={`h-14 w-14 items-center justify-center rounded-full ${
                    micEnabled ? 'bg-white/15' : 'bg-[#1A1A1A]'
                  } active:opacity-80`}>
                  {micEnabled ? (
                    <Mic size={22} color="#FFFFFF" />
                  ) : (
                    <MicOff size={22} color="#FFFFFF" />
                  )}
                </Pressable>

                <Pressable
                  onPress={() => void stop()}
                  className="h-16 w-16 items-center justify-center rounded-full bg-[#FF3B30] active:opacity-90">
                  <Phone size={26} color="#FFFFFF" style={{ transform: [{ rotate: '135deg' }] }} />
                </Pressable>

                <View className="h-14 w-14 items-center justify-center opacity-0">
                  <Mic size={22} color="#FFFFFF" />
                </View>
              </View>
              <Text className="mt-3 text-[12px] text-white/40">
                {micEnabled ? 'Mic on' : 'Mic off · tap to speak'}
              </Text>
            </View>
          ) : null}
        </View>
      </SafeAreaView>
    </View>
  );
}
