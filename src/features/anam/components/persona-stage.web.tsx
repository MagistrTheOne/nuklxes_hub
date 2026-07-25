import { ANAM_VIDEO_ELEMENT_ID } from '@/features/anam/constants';

type PersonaStageProps = {
  className?: string;
  // Native-only props accepted as no-ops for shared call sites.
  onBridgeMessage?: unknown;
};

/** DOM video target for @anam-ai/js-sdk streamToVideoElement. */
export function PersonaStage({ className }: PersonaStageProps) {
  return (
    <video
      id={ANAM_VIDEO_ELEMENT_ID}
      autoPlay
      playsInline
      muted={false}
      className={className}
      style={{
        width: '100%',
        maxHeight: 420,
        borderRadius: 16,
        backgroundColor: '#0B0B0B',
        objectFit: 'cover',
      }}
    />
  );
}
