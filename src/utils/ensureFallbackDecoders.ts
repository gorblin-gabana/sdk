// Utility to ensure fallback decoders are registered for unknown types
export function ensureFallbackDecoders(instructions: any[], registry: any): void {
  instructions.forEach((ix, _i) => {
    const type = ix.type;
    if (!(registry).decoders.has(type)) {
      registry.register(type, (ix: any) => ({ ...ix, decoded: 'Raw', programId: ix.programId }));
    }
  });
}
