// Name Service decoders and builders

type TransactionInstruction = any;
type PublicKey = any;

// --- Decoders ---
export function decodeRegisterName(ix: TransactionInstruction, programId?: PublicKey) {
  // TODO: Implement registerName instruction decoding
  return { type: 'registerName', data: {} };
}

export function decodeUpdateName(ix: TransactionInstruction, programId?: PublicKey) {
  // TODO: Implement updateName instruction decoding
  return { type: 'updateName', data: {} };
}

export function decodeTransferName(ix: TransactionInstruction, programId?: PublicKey) {
  // TODO: Implement transferName instruction decoding
  return { type: 'transferName', data: {} };
}

// --- Builders ---
export function buildRegisterName(args: any): TransactionInstruction {
  // TODO: Implement registerName instruction builder
  return {} as TransactionInstruction;
}

export function buildUpdateName(args: any): TransactionInstruction {
  // TODO: Implement updateName instruction builder
  return {} as TransactionInstruction;
}

export function buildTransferName(args: any): TransactionInstruction {
  // TODO: Implement transferName instruction builder
  return {} as TransactionInstruction;
}
