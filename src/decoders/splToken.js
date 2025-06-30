"use strict";
// SPL Token decoders and builders
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeMintInstruction = decodeMintInstruction;
exports.decodeTransferInstruction = decodeTransferInstruction;
exports.decodeBurnInstruction = decodeBurnInstruction;
exports.decodeSetAuthorityInstruction = decodeSetAuthorityInstruction;
exports.decodeCreateAccountInstruction = decodeCreateAccountInstruction;
exports.decodeCloseAccountInstruction = decodeCloseAccountInstruction;
exports.buildMintToken = buildMintToken;
exports.buildTransferToken = buildTransferToken;
exports.buildBurnToken = buildBurnToken;
exports.buildSetAuthority = buildSetAuthority;
exports.buildCreateAccount = buildCreateAccount;
exports.buildCloseAccount = buildCloseAccount;
// --- Decoders ---
function decodeMintInstruction(ix, programId) {
    // TODO: Implement SPL Token mint instruction decoding
    return { type: 'mint', data: {} };
}
function decodeTransferInstruction(ix, programId) {
    // TODO: Implement SPL Token transfer instruction decoding
    return { type: 'transfer', data: {} };
}
function decodeBurnInstruction(ix, programId) {
    // TODO: Implement SPL Token burn instruction decoding
    return { type: 'burn', data: {} };
}
function decodeSetAuthorityInstruction(ix, programId) {
    // TODO: Implement SPL Token setAuthority instruction decoding
    return { type: 'setAuthority', data: {} };
}
function decodeCreateAccountInstruction(ix, programId) {
    // TODO: Implement SPL Token createAccount instruction decoding
    return { type: 'createAccount', data: {} };
}
function decodeCloseAccountInstruction(ix, programId) {
    // TODO: Implement SPL Token closeAccount instruction decoding
    return { type: 'closeAccount', data: {} };
}
// --- Builders ---
function buildMintToken(args) {
    // TODO: Implement SPL Token mint instruction builder
    return {};
}
function buildTransferToken(args) {
    // TODO: Implement SPL Token transfer instruction builder
    return {};
}
function buildBurnToken(args) {
    // TODO: Implement SPL Token burn instruction builder
    return {};
}
function buildSetAuthority(args) {
    // TODO: Implement SPL Token setAuthority instruction builder
    return {};
}
function buildCreateAccount(args) {
    // TODO: Implement SPL Token createAccount instruction builder
    return {};
}
function buildCloseAccount(args) {
    // TODO: Implement SPL Token closeAccount instruction builder
    return {};
}
