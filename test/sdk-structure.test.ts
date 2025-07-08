import { GorbchainSDK } from '../src/sdk/GorbchainSDK';
import { SPLTokenInstruction } from '../src/decoders/splToken';

// Use the actual SPL Token program ID constant
const SPL_TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';

describe('SDK Structure Tests', () => {
  let sdk: GorbchainSDK;

  beforeEach(() => {
    sdk = new GorbchainSDK({ rpcEndpoint: 'https://rpc.gorbchain.xyz' });
  });

  test('SDK initializes with default config', () => {
    expect(sdk.config).toBeDefined();
    expect(sdk.config.rpcEndpoint).toBe('https://rpc.gorbchain.xyz');
    expect(sdk.config.network).toBe('gorbchain');
  });

  test('SDK initializes with custom config', () => {
    const customSdk = new GorbchainSDK({
      rpcEndpoint: 'https://api.devnet.solana.com',
      network: 'devnet'
    });

    expect(customSdk.config.rpcEndpoint).toBe('https://api.devnet.solana.com');
    expect(customSdk.config.network).toBe('devnet');
  });

  test('Decoder registry is initialized', () => {
    expect(sdk.decoders).toBeDefined();
    const programs = sdk.getSupportedPrograms();
    expect(Array.isArray(programs)).toBe(true);
    expect(programs.length).toBeGreaterThan(0);
  });

  test('Can decode SPL Token Transfer instruction', () => {
    // Mock SPL Token Transfer instruction
    const mockInstruction = {
      programId: SPL_TOKEN_PROGRAM_ID,
      data: new Uint8Array([
        SPLTokenInstruction.Transfer, // instruction type
        0x00, 0x10, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 // amount: 4096
      ]),
      accounts: [
        'SourceAccount1111111111111111111111111111',
        'DestAccount11111111111111111111111111111',
        'Authority111111111111111111111111111111'
      ]
    };

    const decoded = sdk.decodeInstruction(mockInstruction);

    expect(decoded.type).toBe('spl-token-transfer');
    expect(decoded.programId).toBe(SPL_TOKEN_PROGRAM_ID);
    expect(decoded.data.amount).toBe('4096');
    expect(decoded.data.source).toBe('SourceAccount1111111111111111111111111111');
    expect(decoded.data.destination).toBe('DestAccount11111111111111111111111111111');
    expect(decoded.data.authority).toBe('Authority111111111111111111111111111111');
  });

  test('Can decode SPL Token MintTo instruction', () => {
    const mockInstruction = {
      programId: SPL_TOKEN_PROGRAM_ID,
      data: new Uint8Array([
        SPLTokenInstruction.MintTo, // instruction type
        0x40, 0x42, 0x0F, 0x00, 0x00, 0x00, 0x00, 0x00 // amount: 1000000
      ]),
      accounts: [
        'MintAccount1111111111111111111111111111111',
        'TokenAccount111111111111111111111111111',
        'MintAuthority11111111111111111111111111'
      ]
    };

    const decoded = sdk.decodeInstruction(mockInstruction);

    expect(decoded.type).toBe('spl-token-mint-to');
    expect(decoded.programId).toBe(SPL_TOKEN_PROGRAM_ID);
    expect(decoded.data.amount).toBe('1000000');
    expect(decoded.data.mint).toBe('MintAccount1111111111111111111111111111111');
  });

  test('Can register custom decoder', () => {
    const customDecoder = (instruction: any) => ({
      type: 'custom-test',
      programId: 'CustomProgram1111111111111111111111111111',
      data: { custom: true },
      accounts: instruction.accounts || [],
      raw: instruction
    });

    sdk.registerDecoder('custom-program', 'CustomProgram1111111111111111111111111111', customDecoder);

    const programs = sdk.getSupportedPrograms();
    expect(programs).toEqual(expect.arrayContaining(['custom-program']));

    const mockInstruction = {
      programId: 'CustomProgram1111111111111111111111111111',
      data: new Uint8Array([1, 2, 3]),
      accounts: []
    };

    const decoded = sdk.decodeInstruction(mockInstruction);
    expect(decoded.type).toBe('custom-test');
    expect(decoded.data.custom).toBe(true);
  });

  test('Handles unknown program gracefully', () => {
    const mockInstruction = {
      programId: 'UnknownProgram111111111111111111111111111',
      data: new Uint8Array([1, 2, 3]),
      accounts: []
    };

    const decoded = sdk.decodeInstruction(mockInstruction);
    expect(decoded.type).toBe('unknown');
    expect(decoded.data.raw).toEqual([1, 2, 3]);
    expect(decoded.data.hex).toBe('010203');
  });

  test('Can decode multiple instructions', () => {
    const instructions = [
      {
        programId: SPL_TOKEN_PROGRAM_ID,
        data: new Uint8Array([SPLTokenInstruction.Transfer, 0x00, 0x10, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
        accounts: ['Source111', 'Dest1111', 'Auth11111']
      },
      {
        programId: SPL_TOKEN_PROGRAM_ID,
        data: new Uint8Array([SPLTokenInstruction.MintTo, 0x40, 0x42, 0x0F, 0x00, 0x00, 0x00, 0x00, 0x00]),
        accounts: ['Mint11111', 'Account11', 'Authority']
      }
    ];

    const decoded = sdk.decodeInstructions(instructions);

    expect(decoded).toHaveLength(2);
    expect(decoded[0].type).toBe('spl-token-transfer');
    expect(decoded[1].type).toBe('spl-token-mint-to');
  });
});
