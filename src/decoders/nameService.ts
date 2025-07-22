// Name Service decoders and builders

interface TransactionInstruction {
  programId: string;
  data: Uint8Array;
  accounts: string[];
}

interface PublicKey {
  toString(): string;
}

interface NameServiceResult {
  type: string;
  data: Record<string, unknown>;
}

// --- Decoders ---
export function decodeRegisterName(
  _ix: TransactionInstruction,
  _programId?: PublicKey,
): NameServiceResult {
  // TODO: Implement registerName instruction decoding
  return { type: "registerName", data: {} };
}

export function decodeUpdateName(
  _ix: TransactionInstruction,
  _programId?: PublicKey,
): NameServiceResult {
  // TODO: Implement updateName instruction decoding
  return { type: "updateName", data: {} };
}

export function decodeTransferName(
  _ix: TransactionInstruction,
  _programId?: PublicKey,
): NameServiceResult {
  // TODO: Implement transferName instruction decoding
  return { type: "transferName", data: {} };
}

// --- Builders ---
export function buildRegisterName(
  _args: Record<string, unknown>,
): TransactionInstruction {
  // TODO: Implement registerName instruction builder
  return {} as TransactionInstruction;
}

export function buildUpdateName(
  _args: Record<string, unknown>,
): TransactionInstruction {
  // TODO: Implement updateName instruction builder
  return {} as TransactionInstruction;
}

export function buildTransferName(
  _args: Record<string, unknown>,
): TransactionInstruction {
  // TODO: Implement transferName instruction builder
  return {} as TransactionInstruction;
}
