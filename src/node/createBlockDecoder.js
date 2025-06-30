"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBlockDecoder = createBlockDecoder;
function createBlockDecoder(registry, overrides) {
    return function decodeBlock(block) {
        return block.instructions.map(ix => registry.decode(ix.type, ix, overrides === null || overrides === void 0 ? void 0 : overrides[ix.type]));
    };
}
