"use strict";
// Name Service decoders and builders
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeRegisterName = decodeRegisterName;
exports.decodeUpdateName = decodeUpdateName;
exports.decodeTransferName = decodeTransferName;
exports.buildRegisterName = buildRegisterName;
exports.buildUpdateName = buildUpdateName;
exports.buildTransferName = buildTransferName;
// --- Decoders ---
function decodeRegisterName(ix, programId) {
    // TODO: Implement registerName instruction decoding
    return { type: 'registerName', data: {} };
}
function decodeUpdateName(ix, programId) {
    // TODO: Implement updateName instruction decoding
    return { type: 'updateName', data: {} };
}
function decodeTransferName(ix, programId) {
    // TODO: Implement transferName instruction decoding
    return { type: 'transferName', data: {} };
}
// --- Builders ---
function buildRegisterName(args) {
    // TODO: Implement registerName instruction builder
    return {};
}
function buildUpdateName(args) {
    // TODO: Implement updateName instruction builder
    return {};
}
function buildTransferName(args) {
    // TODO: Implement transferName instruction builder
    return {};
}
