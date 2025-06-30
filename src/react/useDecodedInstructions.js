"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useDecodedInstructions = useDecodedInstructions;
// React hook: useDecodedInstructions
const react_1 = require("react");
function useDecodedInstructions(instructions, registry, overrides) {
    const [decoded, setDecoded] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        setLoading(true);
        const results = instructions.map(ix => {
            // Example: use registry to decode, with optional programId overrides
            return registry.decode(ix.type, ix, overrides === null || overrides === void 0 ? void 0 : overrides[ix.type]);
        });
        setDecoded(results);
        setLoading(false);
    }, [instructions, registry, overrides]);
    return { decoded, loading };
}
