import { ANAM_VIDEO_ELEMENT_ID } from '@/features/anam/constants';

type PersonaStageProps = {
  className?: string;
  fill?: boolean;
  // Native-only props accepted as no-ops for shared call sites.
  onBridgeMessage?: unknown;
};

/** DOM video target for @anam-ai/js-sdk streamToVideoElement. */
export function PersonaStage({ className, fill }: PersonaStageProps) {
  return (
    <video
      id={ANAM_VIDEO_ELEMENT_ID}
      autoPlay
      playsInline
      muted={false}
      className={className}
      style={{
        width: '100%',
        height: fill ? '100%' : undefined,
        maxHeight: fill ? '100%' : 420,
        flex: fill ? 1 : undefined,
        borderRadius: fill ? 0 : 16,
        backgroundColor: '#050505',
        objectFit: 'cover',
      }}
    />
  );
}
