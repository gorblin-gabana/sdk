"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const splToken = __importStar(require("../src/decoders/splToken"));
const token2022 = __importStar(require("../src/decoders/token2022"));
const metadata = __importStar(require("../src/decoders/metadata"));
const decoders = __importStar(require("../src/decoders"));
describe('SPL Token Decoders', () => {
    it('decodes mint', () => {
        expect(splToken.decodeMintInstruction({})).toHaveProperty('type', 'mint');
    });
});
describe('Token-2022 Decoders', () => {
    it('decodes token2022Mint', () => {
        expect(token2022.decodeToken2022Mint({})).toHaveProperty('type', 'token2022Mint');
    });
});
describe('Metadata Decoders', () => {
    it('decodes createMetadata', () => {
        expect(metadata.decodeCreateMetadata({})).toHaveProperty('type', 'createMetadata');
    });
});
describe('Mint Account Decoding', () => {
    it('decodes SPL Token mint account', () => {
        // Fake 82-byte buffer for SPL Token mint (all zeros)
        const buf = new Uint8Array(82);
        const decoded = decoders.decodeMintAccount(buf);
        expect(decoded).toHaveProperty('supply');
        expect(decoded).toHaveProperty('decimals');
        expect(decoded).toHaveProperty('isInitialized');
        expect(decoded).toHaveProperty('tlvExtensions');
    });
    it('decodes Token-2022 mint account with TLV', () => {
        var _a, _b, _c, _d;
        // Fake 300-byte buffer with TLV extension type 6 (Token Metadata)
        const buf = new Uint8Array(300);
        buf[82] = 6; // type
        buf[83] = 232;
        buf[84] = 0; // length = 232
        // Fill name, symbol, uri, updateAuthority with ASCII
        for (let i = 0; i < 32; i++)
            buf[86 + i] = 65 + (i % 26); // name: A...
        for (let i = 0; i < 12; i++)
            buf[86 + 32 + i] = 97 + (i % 26); // symbol: a...
        for (let i = 0; i < 156; i++)
            buf[86 + 44 + i] = 48 + (i % 10); // uri: 0...
        for (let i = 0; i < 32; i++)
            buf[86 + 200 + i] = i; // updateAuthority
        const decoded = decoders.decodeMintAccount(buf);
        expect(decoded.tokenMetadata).toBeTruthy();
        expect((_a = decoded.tokenMetadata) === null || _a === void 0 ? void 0 : _a.name).toMatch(/A+/);
        expect((_b = decoded.tokenMetadata) === null || _b === void 0 ? void 0 : _b.symbol).toMatch(/a+/);
        expect((_c = decoded.tokenMetadata) === null || _c === void 0 ? void 0 : _c.uri).toMatch(/0+/);
        expect((_d = decoded.tokenMetadata) === null || _d === void 0 ? void 0 : _d.updateAuthority).toBeTruthy();
    });
});
