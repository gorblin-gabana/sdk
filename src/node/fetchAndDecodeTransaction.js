"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchAndDecodeTransaction = fetchAndDecodeTransaction;
function fetchAndDecodeTransaction(signature, rpcUrl, registry, overrides) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield fetch(rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'getTransaction',
                params: [signature, { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 }],
            }),
        });
        const { result } = yield res.json();
        if (!result)
            throw new Error('Transaction not found');
        const instructions = result.transaction.message.instructions;
        const decoded = instructions.map((ix) => registry.decode(ix.program, ix, overrides === null || overrides === void 0 ? void 0 : overrides[ix.program]));
        return Object.assign(Object.assign({}, result), { decodedInstructions: decoded });
    });
}
