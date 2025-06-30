"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const registry_1 = require("../src/registry");
describe('DecoderRegistry', () => {
    it('registers and decodes using a custom decoder', () => {
        const registry = new registry_1.DecoderRegistry();
        registry.register('test', (ix) => ({ type: 'test', data: ix }));
        const result = registry.decode('test', { foo: 1 });
        expect(result).toEqual({ type: 'test', data: { foo: 1 } });
    });
});
