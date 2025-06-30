// Node utility: createBlockDecoder
import { DecoderRegistry } from '../registry';

export function createBlockDecoder(registry: DecoderRegistry, overrides?: Record<string, any>) {
  return function decodeBlock(block: { instructions: any[] }) {
    return block.instructions.map(ix =>
      registry.decode(ix.type, ix, overrides?.[ix.type])
    );
  };
}
