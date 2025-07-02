// Helper to convert base64 to hex (browser-safe)
export function base64ToHex(base64: string) {
  const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  return Array.from(bytes).map(x => x.toString(16).padStart(2, '0')).join('');
}
