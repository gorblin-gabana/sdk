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
exports.default = App;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const registry_1 = require("../../src/registry");
const useDecodedInstructions_1 = require("../../src/react/useDecodedInstructions");
const registry = new registry_1.DecoderRegistry();
// Register core decoders here as needed
function App() {
    const [sig, setSig] = (0, react_1.useState)('');
    const [instructions, setInstructions] = (0, react_1.useState)([]);
    const { decoded, loading } = (0, useDecodedInstructions_1.useDecodedInstructions)(instructions, registry);
    const handleSearch = () => __awaiter(this, void 0, void 0, function* () {
        // Fetch transaction from gorbchain RPC
        const res = yield fetch('https://rpc.gorbchain.xyz', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'getTransaction',
                params: [sig, { maxSupportedTransactionVersion: 0 }],
            }),
        });
        const data = yield res.json();
        const tx = data.result;
        if (tx && tx.transaction && tx.transaction.message && tx.transaction.message.instructions) {
            setInstructions(tx.transaction.message.instructions.map((ix, i) => (Object.assign(Object.assign({}, ix), { type: 'unknown' + i }))));
        }
        else {
            setInstructions([]);
        }
    });
    return ((0, jsx_runtime_1.jsxs)("div", { style: { padding: 32 }, children: [(0, jsx_runtime_1.jsx)("h2", { children: "ChainDecode Explorer" }), (0, jsx_runtime_1.jsx)("input", { value: sig, onChange: e => setSig(e.target.value), placeholder: "Enter transaction signature", style: { width: 400, marginRight: 8 } }), (0, jsx_runtime_1.jsx)("button", { onClick: handleSearch, disabled: loading, children: "Search" }), (0, jsx_runtime_1.jsxs)("div", { style: { marginTop: 24 }, children: [loading && (0, jsx_runtime_1.jsx)("div", { children: "Loading..." }), decoded && decoded.length > 0 && ((0, jsx_runtime_1.jsx)("pre", { children: JSON.stringify(decoded, null, 2) }))] })] }));
}
