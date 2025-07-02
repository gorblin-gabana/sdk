// React hook: useInstructionParser
import { useMemo } from 'react';
import { DecoderRegistry } from '../registry/index.js';

export function useInstructionParser(registry: DecoderRegistry, overrides?: Record<string, any>) {
  return useMemo(() => {
    return (ix: any) => registry.decode(ix.type, ix, overrides?.[ix.type]);
  }, [registry, overrides]);
}
