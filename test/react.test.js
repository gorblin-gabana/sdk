"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("@testing-library/react");
const useDecodedInstructions_1 = require("../src/react/useDecodedInstructions");
const registry_1 = require("../src/registry");
function TestComponent({ instructions, registry }) {
    const { decoded, loading } = (0, useDecodedInstructions_1.useDecodedInstructions)(instructions, registry);
    return ((0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("div", { "data-testid": "loading", children: loading ? 'loading' : 'done' }), (0, jsx_runtime_1.jsx)("div", { "data-testid": "decoded", children: JSON.stringify(decoded) })] }));
}
describe('useDecodedInstructions', () => {
    it('decodes instructions using registry', () => {
        const registry = new registry_1.DecoderRegistry();
        registry.register('test', (ix) => ({ type: 'test', data: ix }));
        let utils;
        (0, react_1.act)(() => {
            utils = (0, react_1.render)((0, jsx_runtime_1.jsx)(TestComponent, { instructions: [{ type: 'test', foo: 1 }], registry: registry }));
        });
        const decoded = utils.getByTestId('decoded').textContent;
        expect(decoded).toContain('test');
        expect(decoded).toContain('foo');
    });
});
