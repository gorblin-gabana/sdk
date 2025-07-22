import { bytesToBase58 } from "./base58.js";

export interface DecodedMintAccount {
  supply: string;
  decimals: number;
  isInitialized: boolean;
  mintAuthority: {
    option: number;
    address: string;
    base58: string;
  };
  freezeAuthority: {
    option: number;
    address: string;
    base58: string;
  };
  raw: string;
  metadata?: {
    name?: string;
    symbol?: string;
    uri?: string;
    updateAuthority?: string;
    creators?: Array<{ address: string; verified: boolean; share: number }>;
    sellerFeeBasisPoints?: number;
    collection?: { verified: boolean; key: string };
    uses?: any;
    editionNonce?: number;
    // Add more fields as needed for NFT/Metaplex
  };
}

/**
 * Decodes a Mint account buffer according to the SPL Token program spec.
 * Returns a deeply nested, descriptive object for frontend and explorer use.
 * Also parses Metaplex Token Metadata extension if present.
 */
export function decodeMintAccount(
  input: Uint8Array | string,
  opts?: { encoding?: "base64" | "base58" | "hex" },
): DecodedMintAccount {
  let buf: Uint8Array;
  if (typeof input === "string") {
    if (opts?.encoding === "base64") {
      buf = Uint8Array.from(atob(input), (c) => c.charCodeAt(0));
    } else if (opts?.encoding === "hex") {
      buf = Uint8Array.from(
        input.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)),
      );
    } else {
      throw new Error("Unsupported encoding or missing encoding option");
    }
  } else {
    buf = input;
  }

  const mintAuthorityOption = new DataView(
    buf.buffer,
    buf.byteOffset,
    buf.byteLength,
  ).getUint32(0, true);
  const mintAuthority = buf.slice(4, 36);
  const supply = BigInt(
    new DataView(buf.buffer, buf.byteOffset + 36, 8).getBigUint64(0, true),
  ).toString();
  const decimals = buf[44];
  const isInitialized = buf[45] !== 0;
  const freezeAuthorityOption = new DataView(
    buf.buffer,
    buf.byteOffset + 46,
    4,
  ).getUint32(0, true);
  const freezeAuthority = buf.slice(50, 82);

  // Parse Metaplex Token Metadata extension if present (Token-2022 TLV extension type 6)
  let metadata: DecodedMintAccount["metadata"] | undefined = undefined;
  if (buf.length > 82 && buf[82] === 6) {
    // TLV extension type 6: Token Metadata
    // const _length = buf[83] + (buf[84] << 8); // little-endian u16
    const metaStart = 86;
    const name = new TextDecoder()
      .decode(buf.slice(metaStart, metaStart + 32))
      .replace(/\0+$/, "");
    const symbol = new TextDecoder()
      .decode(buf.slice(metaStart + 32, metaStart + 44))
      .replace(/\0+$/, "");
    const uri = new TextDecoder()
      .decode(buf.slice(metaStart + 44, metaStart + 200))
      .replace(/\0+$/, "");
    const updateAuthority = Buffer.from(
      buf.slice(metaStart + 200, metaStart + 232),
    ).toString("hex");
    metadata = { name, symbol, uri, updateAuthority };
    // More fields can be parsed here for full Metaplex support
  }

  return {
    supply,
    decimals,
    isInitialized,
    mintAuthority: {
      option: mintAuthorityOption,
      address: bytesToBase58(mintAuthority),
      base58: bytesToBase58(mintAuthority),
    },
    freezeAuthority: {
      option: freezeAuthorityOption,
      address: bytesToBase58(freezeAuthority),
      base58: bytesToBase58(freezeAuthority),
    },
    raw: Array.from(buf)
      .map((x) => x.toString(16).padStart(2, "0"))
      .join(""),
    metadata,
  };
}
