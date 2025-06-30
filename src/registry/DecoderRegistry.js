"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecoderRegistry = void 0;
// Add support for registering custom programs with IDL/schemas
class DecoderRegistry {
    constructor() {
        this.decoders = new Map();
        this.customPrograms = new Map();
    }
    register(name, fn) {
        this.decoders.set(name, fn);
    }
    decode(name, ix, programId) {
        const fn = this.decoders.get(name);
        if (!fn)
            throw new Error(`No decoder for ${name}`);
        return fn(ix, programId);
    }
    registerProgram(opts) {
        var _a;
        this.customPrograms.set(opts.label, {
            idl: opts.idl,
            types: (_a = opts.types) !== null && _a !== void 0 ? _a : [],
            label: opts.label,
        });
        // TODO: Optionally auto-generate decoders/builders from IDL/types
    }
}
exports.DecoderRegistry = DecoderRegistry;
