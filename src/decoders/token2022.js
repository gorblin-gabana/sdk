"use strict";
// Token-2022 decoders and builders
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeToken2022Mint = decodeToken2022Mint;
exports.decodeToken2022Transfer = decodeToken2022Transfer;
exports.decodeToken2022Extension = decodeToken2022Extension;
exports.buildToken2022Mint = buildToken2022Mint;
exports.buildToken2022Transfer = buildToken2022Transfer;
exports.buildToken2022Extension = buildToken2022Extension;
// --- Decoders ---
function decodeToken2022Mint(ix, programId) {
    // TODO: Implement Token-2022 mint instruction decoding
    return { type: 'token2022Mint', data: {} };
}
function decodeToken2022Transfer(ix, programId) {
    // TODO: Implement Token-2022 transfer instruction decoding
    return { type: 'token2022Transfer', data: {} };
}
function decodeToken2022Extension(ix, programId) {
    // TODO: Implement Token-2022 extension decoding (e.g., transfer fees)
    return { type: 'token2022Extension', data: {} };
}
// --- Builders ---
function buildToken2022Mint(args) {
    // TODO: Implement Token-2022 mint instruction builder
    return {};
}
function buildToken2022Transfer(args) {
    // TODO: Implement Token-2022 transfer instruction builder
    return {};
}
function buildToken2022Extension(args) {
    // TODO: Implement Token-2022 extension builder
    return {};
}
