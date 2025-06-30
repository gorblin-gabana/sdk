// Helper to convert base64 to hex
export function base64ToHex(base64: string) {
  const raw = Buffer.from(base64, 'base64');
  return Array.from(raw).map(x => x.toString(16).padStart(2, '0')).join('');
}
