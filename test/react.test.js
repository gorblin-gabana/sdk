"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_hooks_1 = require("@testing-library/react-hooks");
const useDecodedInstructions_1 = require("../src/react/useDecodedInstructions");
const registry_1 = require("../src/registry");
describe('useDecodedInstructions', () => {
    it('decodes instructions using registry', () => {
        const registry = new registry_1.DecoderRegistry();
        registry.register('test', (ix) => ({ type: 'test', data: ix }));
        const { result } = (0, react_hooks_1.renderHook)(() => (0, useDecodedInstructions_1.useDecodedInstructions)([{ type: 'test', foo: 1 }], registry));
        expect(result.current.decoded[0]).toEqual({ type: 'test', data: { type: 'test', foo: 1 } });
    });
});
