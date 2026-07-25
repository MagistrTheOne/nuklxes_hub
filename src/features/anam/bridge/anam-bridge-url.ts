export function resolveAnamBridgeUrl() {
  const base = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ?? '';
  if (!base) {
    throw new Error('EXPO_PUBLIC_API_URL is required for native Anam WebView bridge');
  }
  return `${base}/api/v1/anam/bridge`;
}
