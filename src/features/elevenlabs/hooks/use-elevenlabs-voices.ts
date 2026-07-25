import { useAuth } from '@clerk/expo';
import { useQuery } from '@tanstack/react-query';

import { fetchElevenLabsVoices } from '@/features/elevenlabs/api/fetch-voices';
import { FALLBACK_ELEVENLABS_VOICES } from '@/features/elevenlabs/constants';
import type { ElevenLabsVoice } from '@/features/elevenlabs/types';

export function useElevenLabsVoices() {
  const { getToken, isSignedIn } = useAuth();

  return useQuery({
    queryKey: ['elevenlabs', 'voices'],
    enabled: Boolean(isSignedIn),
    queryFn: () => fetchElevenLabsVoices(getToken),
    staleTime: 5 * 60_000,
    placeholderData: FALLBACK_ELEVENLABS_VOICES as unknown as ElevenLabsVoice[],
  });
}
