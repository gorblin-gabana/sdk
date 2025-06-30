"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecoderRegistry = void 0;
class DecoderRegistry {
    constructor() {
        this.decoders = new Map();
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
}
exports.DecoderRegistry = DecoderRegistry;
