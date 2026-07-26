import { useUser } from '@clerk/expo';
import { useLocalSearchParams } from 'expo-router';
import { Play, Square } from 'lucide-react-native';
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

function statusLabel(status: string, pipelineState: string): string {
  if (status === 'minting' || status === 'connecting') return 'Connecting…';
  if (status === 'connected') {
    if (pipelineState === 'thinking') return 'Thinking…';
    if (pipelineState === 'speaking') return 'Speaking…';
    return 'Live session · Secure connection';
  }
  if (status === 'error') return 'Unavailable';
  return 'Standing by · connection check';
}

export default function LiveScreen() {
  const {
    employeeId: paramId,
    talkSessionId,
    voiceMode: talkVoiceMode,
    autoStart,
  } = useLocalSearchParams<{
    employeeId?: string;
    talkSessionId?: string;
    voiceMode?: string;
    autoStart?: string;
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
  const autoStartedRef = useRef(false);

  useEffect(() => {
    setSelectedId(resolveId(paramId));
    autoStartedRef.current = false;
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
  });

  const shouldAutoStart =
    autoStart === '1' || autoStart === 'true' || Boolean(talkSessionId);

  useEffect(() => {
    if (!shouldAutoStart) return;
    if (autoStartedRef.current) return;
    if (status !== 'idle') return;
    autoStartedRef.current = true;
    void start();
  }, [shouldAutoStart, status, start, selectedId]);

  const connected = status === 'connected';
  const busy = status === 'minting' || status === 'connecting';

  return (
    <View className="flex-1 bg-[#050505]">
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <View className="flex-row items-start justify-between px-5 pb-3 pt-2">
          <View className="flex-1 pr-3">
            <Text className="text-[24px] font-semibold text-white">
              Talk · {employee?.name?.split(/\s+/)[0] ?? 'Assistant'}
            </Text>
            <Text className="mt-1 text-[14px] text-white/45">
              {statusLabel(status, pipelineState)}
            </Text>
          </View>
          {connected ? (
            <Pressable
              onPress={() => void stop()}
              className="h-9 items-center justify-center rounded-full border border-red-500/50 px-3.5 active:opacity-80">
              <Text className="text-[13px] font-semibold text-red-400">End session</Text>
            </Pressable>
          ) : null}
        </View>

        <View className="mx-5 mb-3 flex-row flex-wrap gap-2">
          {ready.slice(0, 6).map((item) => {
            const active = item.id === selectedId;
            return (
              <Pressable
                key={item.id}
                onPress={() => {
                  if (status === 'connected') void stop();
                  autoStartedRef.current = false;
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

        <View className="relative mx-5 flex-1 overflow-hidden rounded-3xl border border-white/10 bg-[#0B0B0B]">
          {isNativeBridge ? (
            <PersonaStage ref={bridgeRef} onBridgeMessage={onBridgeMessage} />
          ) : (
            <PersonaStage />
          )}

          <View className="absolute inset-x-0 bottom-0 items-center pb-6 pt-16">
            {error ? (
              <Text className="mb-3 px-4 text-center text-[13px] text-red-400">
                Session could not start. Try again.
              </Text>
            ) : null}

            <Pressable
              onPress={() => {
                if (connected) {
                  void stop();
                  return;
                }
                void start();
              }}
              disabled={busy}
              className="h-14 min-w-[200px] flex-row items-center justify-center rounded-full bg-white px-8 active:opacity-90 disabled:opacity-45">
              {busy ? (
                <Text className="text-[16px] font-semibold text-[#050505]">Connecting…</Text>
              ) : connected ? (
                <>
                  <Square size={16} color="#050505" fill="#050505" />
                  <Text className="ml-2 text-[16px] font-semibold text-[#050505]">
                    Stop session
                  </Text>
                </>
              ) : (
                <>
                  <Play size={18} color="#050505" fill="#050505" />
                  <Text className="ml-2 text-[16px] font-semibold text-[#050505]">
                    Start session
                  </Text>
                </>
              )}
            </Pressable>

            <Text className="mt-3 text-[12px] text-white/35">
              {connected ? 'Video · live' : 'Tap to start video with avatar'}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
