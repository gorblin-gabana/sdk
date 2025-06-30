"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useInstructionParser = useInstructionParser;
// React hook: useInstructionParser
const react_1 = require("react");
function useInstructionParser(registry, overrides) {
    return (0, react_1.useMemo)(() => {
        return (ix) => registry.decode(ix.type, ix, overrides === null || overrides === void 0 ? void 0 : overrides[ix.type]);
    }, [registry, overrides]);
}
