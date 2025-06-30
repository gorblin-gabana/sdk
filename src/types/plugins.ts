// Plugin interface for user-defined decoders and IDL-based plugins
export interface DecoderPlugin {
  name: string;
  register(registry: any): void;
}

export interface IDLPlugin extends DecoderPlugin {
  idl: any;
}

export function registerPlugin(plugin: DecoderPlugin, registry: any) {
  plugin.register(registry);
}
