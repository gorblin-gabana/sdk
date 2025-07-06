// Gorbchain SDK config
export interface GorbchainConfig {
  backendUrl?: string;
  rpcUrl?: string;
  programIds?: Record<string, string>;
}

let _config: GorbchainConfig = {
  backendUrl: 'https://gorbscan.com',
  rpcUrl: 'https://rpc.gorbchain.xyz',
  programIds: {
    token2022: 'FGyzDo6bhE7gFmSYymmFnJ3SZZu3xWGBA7sNHXR7QQsn',
    ata: '4YpYoLVTQ8bxcne9GneN85RUXeN7pqGTwgPcY71ZL5gX',
    metaplex: 'BvoSmPBF6mBRxBMY9FPguw1zUoUg3xrc5CaWf7y5ACkc'
  }
};

export function setGorbchainConfig(cfg: Partial<GorbchainConfig>) {
  _config = { ..._config, ...cfg, programIds: { ..._config.programIds, ...cfg.programIds } };
}

export function getGorbchainConfig(): GorbchainConfig {
  return _config;
}

export const PROGRAM_IDS = _config.programIds!;
