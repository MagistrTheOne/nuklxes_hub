import type { BrainApiConfig } from '@/server/brain/types';

type SupportedProvider = BrainApiConfig['provider'];

function trimUrl(url: string) {
  return url.replace(/\/$/, '');
}

export function isSupportedBrainProvider(value: string): value is SupportedProvider {
  return value === 'openai' || value === 'nullxes' || value === 'xai';
}

export function resolveBrainApiConfig(input: {
  provider: string;
  model?: string | null;
}): BrainApiConfig {
  const provider = input.provider.trim();

  if (provider === 'nullxes') {
    const baseUrl =
      process.env.NULLXES_BRAIN_API_BASE_URL?.trim() ||
      process.env.NULLXES_API_BASE_URL?.trim();
    const apiKey =
      process.env.NULLXES_BRAIN_API_KEY?.trim() ||
      process.env.NULLXES_API_KEY?.trim();
    const configured = input.model?.trim();
    // Neon brain config often stores an OpenAI model id even for nullxes rows.
    const model =
      (configured?.includes('/') ? configured : null) ||
      process.env.NULLXES_BRAIN_MODEL?.trim() ||
      process.env.NULLXES_API_DEFAULT_MODEL?.trim() ||
      configured ||
      'MagistrTheOne/SHUTEN-DOJI';

    if (!baseUrl || !apiKey) {
      throw new Error('NULLXES brain API is not configured (NULLXES_BRAIN_*)');
    }

    return {
      provider: 'nullxes',
      baseUrl: trimUrl(baseUrl),
      apiKey,
      model,
    };
  }

  if (provider === 'xai') {
    const apiKey = process.env.XAI_API_KEY?.trim();
    const baseUrl = trimUrl(
      process.env.XAI_API_BASE_URL?.trim() || 'https://api.x.ai/v1',
    );
    const model = input.model?.trim() || 'grok-4-1-fast-non-reasoning';

    if (!apiKey) {
      throw new Error('XAI_API_KEY is not configured');
    }

    return { provider: 'xai', baseUrl, apiKey, model };
  }

  if (provider === 'openai') {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    const baseUrl = trimUrl(
      process.env.OPENAI_API_BASE_URL?.trim() || 'https://api.openai.com/v1',
    );
    const model = input.model?.trim() || 'gpt-4.1-mini';

    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    return { provider: 'openai', baseUrl, apiKey, model };
  }

  throw new Error(`Unsupported brain provider: ${provider}`);
}

export function getBrainFailoverProvider(
  provider: SupportedProvider,
): SupportedProvider | null {
  if (provider === 'nullxes') return 'openai';
  if (provider === 'openai') return 'nullxes';
  return null;
}

export function formatBrainModelLabel(api: BrainApiConfig): string {
  if (api.provider === 'nullxes') return 'SHUTEN';
  if (api.provider === 'xai') return `xAI · ${api.model}`;
  return `OpenAI · ${api.model}`;
}
