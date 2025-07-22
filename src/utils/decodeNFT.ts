// Utility for decoding Metaplex NFT Metadata account data
export interface DecodedNFTMetadata {
  name: string;
  symbol: string;
  uri: string;
  sellerFeeBasisPoints: number;
  creators?: Array<{ address: string; verified: boolean; share: number }>;
  collection?: { verified: boolean; key: string };
  uses?: any;
  editionNonce?: number;
  updateAuthority?: string;
}

/**
 * Decode a Metaplex Metadata account buffer (raw data)
 * This is a minimal implementation for demonstration. For full support, use BufferLayout or Beet.
 */
export function decodeNFT(data: Buffer | Uint8Array): DecodedNFTMetadata {
  // Metaplex Metadata layout (v1):
  // https://github.com/metaplex-foundation/metaplex-program-library/blob/master/token-metadata/program/src/state/metadata.rs
  // [key (1), updateAuthority (32), mint (32), name (32), symbol (10), uri (200), sellerFeeBasisPoints (2), ...]
  const name = Buffer.from(data.slice(1 + 32 + 32, 1 + 32 + 32 + 32))
    .toString("utf8")
    .replace(/\0+$/, "");
  const symbol = Buffer.from(
    data.slice(1 + 32 + 32 + 32, 1 + 32 + 32 + 32 + 10),
  )
    .toString("utf8")
    .replace(/\0+$/, "");
  const uri = Buffer.from(
    data.slice(1 + 32 + 32 + 32 + 10, 1 + 32 + 32 + 32 + 10 + 200),
  )
    .toString("utf8")
    .replace(/\0+$/, "");
  // Use DataView for cross-type compatibility
  const sellerFeeOffset = 1 + 32 + 32 + 32 + 10 + 200;
  let sellerFeeBasisPoints = 0;
  if (typeof Buffer !== "undefined" && data instanceof Buffer) {
    sellerFeeBasisPoints = data.readUInt16LE(sellerFeeOffset);
  } else {
    const dv = new DataView(
      (data as Uint8Array).buffer,
      (data as Uint8Array).byteOffset,
      (data as Uint8Array).byteLength,
    );
    sellerFeeBasisPoints = dv.getUint16(sellerFeeOffset, true);
  }
  return {
    name,
    symbol,
    uri,
    sellerFeeBasisPoints,
    // TODO: parse creators, collection, uses, editionNonce, updateAuthority, etc.
  };
}
