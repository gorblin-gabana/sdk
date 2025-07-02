// React hook: useDecodedInstructions
import { useEffect, useState } from 'react';
import { DecoderRegistry } from '../registry/index.js';

export function useDecodedInstructions(
  instructions: any[],
  registry: DecoderRegistry,
  overrides?: Record<string, any>
) {
  const [decoded, setDecoded] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const results = instructions.map(ix => {
      // Example: use registry to decode, with optional programId overrides
      return registry.decode(ix.type, ix, overrides?.[ix.type]);
    });
    setDecoded(results);
    setLoading(false);
  }, [instructions, registry, overrides]);

  return { decoded, loading };
}
