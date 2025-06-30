// React hook: useForkDecoder
import { useMemo } from 'react';
import { DecoderRegistry } from '../registry';

export function useForkDecoder(forkProgramIds: Record<string, string>, registry: DecoderRegistry) {
  return useMemo(() => {
    return (ix: any) => {
      const programId = forkProgramIds[ix.type] || ix.programId;
      return registry.decode(ix.type, { ...ix, programId });
    };
  }, [forkProgramIds, registry]);
}
