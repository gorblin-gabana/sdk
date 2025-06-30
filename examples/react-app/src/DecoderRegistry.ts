// DecoderRegistry: Manages decoder functions for Solana instructions
export class DecoderRegistry {
  private decoders = new Map<string, (ix: any, programId?: any) => any>();
  private customPrograms = new Map<string, { idl: any; types: any[]; label: string }>();

  register(name: string, fn: (ix: any, programId?: any) => any) {
    this.decoders.set(name, fn);
  }

  decode(name: string, ix: any, programId?: any) {
    const fn = this.decoders.get(name);
    if (!fn) throw new Error(`No decoder for ${name}`);
    return fn(ix, programId);
  }

  registerProgram(opts: { programId: any; idl: any; label: string; types?: any[] }) {
    this.customPrograms.set(opts.label, {
      idl: opts.idl,
      types: opts.types ?? [],
      label: opts.label,
    });
    // TODO: Optionally auto-generate decoders/builders from IDL/types
  }
}
