"use strict";
// Metaplex/Metadata decoders and builders
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeCreateMetadata = decodeCreateMetadata;
exports.decodeUpdateMetadata = decodeUpdateMetadata;
exports.decodeMintNewEdition = decodeMintNewEdition;
exports.buildCreateMetadata = buildCreateMetadata;
exports.buildUpdateMetadata = buildUpdateMetadata;
exports.buildMintNewEdition = buildMintNewEdition;
// --- Decoders ---
function decodeCreateMetadata(ix, programId) {
    // TODO: Implement CreateMetadata decoding
    return { type: 'createMetadata', data: {} };
}
function decodeUpdateMetadata(ix, programId) {
    // TODO: Implement UpdateMetadata decoding
    return { type: 'updateMetadata', data: {} };
}
function decodeMintNewEdition(ix, programId) {
    // TODO: Implement MintNewEdition decoding
    return { type: 'mintNewEdition', data: {} };
}
// --- Builders ---
function buildCreateMetadata(args) {
    // TODO: Implement CreateMetadata builder
    return {};
}
function buildUpdateMetadata(args) {
    // TODO: Implement UpdateMetadata builder
    return {};
}
function buildMintNewEdition(args) {
    // TODO: Implement MintNewEdition builder
    return {};
}
