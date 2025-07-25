import {
  decodeSPLTokenInstruction,
  SPLTokenInstruction,
} from "../src/decoders/splToken";
import { DecoderRegistry } from "../src/decoders/registry";

describe("SPL Token Decoders", () => {
  it("decodes transfer instruction", () => {
    // Mock transfer instruction data
    const transferData = new Uint8Array(9);
    transferData[0] = SPLTokenInstruction.Transfer; // instruction type
    // Set amount (8 bytes little endian)
    transferData[1] = 100; // amount: 100

    const mockInstruction = {
      programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
      data: transferData,
      accounts: ["source", "destination", "authority"],
    };

    const decoded = decodeSPLTokenInstruction(mockInstruction);
    expect(decoded).toHaveProperty("type", "spl-token-transfer");
    expect(decoded.data.amount).toBe("100");
  });

  it("decodes mint instruction", () => {
    // Mock mint instruction data
    const mintData = new Uint8Array(9);
    mintData[0] = SPLTokenInstruction.MintTo; // instruction type
    mintData[1] = 50; // amount: 50

    const mockInstruction = {
      programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
      data: mintData,
      accounts: ["mint", "account", "authority"],
    };

    const decoded = decodeSPLTokenInstruction(mockInstruction);
    expect(decoded).toHaveProperty("type", "spl-token-mint-to");
    expect(decoded.data.amount).toBe("50");
  });

  it("handles unknown instruction types", () => {
    const mockInstruction = {
      programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
      data: new Uint8Array([255]), // unknown instruction type
      accounts: [],
    };

    const decoded = decodeSPLTokenInstruction(mockInstruction);
    expect(decoded).toHaveProperty("type", "spl-token-unknown");
    expect(decoded.data.error).toContain(
      "Unknown SPL Token instruction type: 255",
    );
  });
});

describe("Decoder Registry", () => {
  it("registers and decodes instructions", () => {
    const registry = new DecoderRegistry();

    // Create a wrapper to adapt the interface
    const splTokenWrapper = (instruction: any) => {
      return decodeSPLTokenInstruction({
        programId: instruction.programId,
        data: instruction.data as Uint8Array,
        accounts: instruction.accounts || [],
      });
    };

    registry.register(
      "spl-token",
      "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
      splTokenWrapper,
    );

    const mockInstruction = {
      programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
      data: new Uint8Array([
        SPLTokenInstruction.Transfer, // instruction type
        25,
        0,
        0,
        0,
        0,
        0,
        0,
        0, // amount: 25 (8 bytes little endian)
      ]),
      accounts: ["source", "destination", "authority"],
    };

    const decoded = registry.decode(mockInstruction);
    expect(decoded).toHaveProperty("type", "spl-token-transfer");
  });

  it("returns unknown type for unregistered programs", () => {
    const registry = new DecoderRegistry();

    const mockInstruction = {
      programId: "UnknownProgram123",
      data: new Uint8Array([1, 2, 3]),
      accounts: [],
    };

    const decoded = registry.decode(mockInstruction);
    expect(decoded).toHaveProperty("type", "unknown");
  });
});
