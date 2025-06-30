"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useForkDecoder = useForkDecoder;
// React hook: useForkDecoder
const react_1 = require("react");
function useForkDecoder(forkProgramIds, registry) {
    return (0, react_1.useMemo)(() => {
        return (ix) => {
            const programId = forkProgramIds[ix.type] || ix.programId;
            return registry.decode(ix.type, Object.assign(Object.assign({}, ix), { programId }));
        };
    }, [forkProgramIds, registry]);
}
