declare module 'privacycash/dist/deposit' {
    export function deposit(params: any): Promise<{ tx: string }>;
}

declare module 'privacycash/dist/withdraw' {
    export function withdraw(params: any): Promise<{ tx: string }>;
}

declare module 'privacycash/dist/getUtxos' {
    export function getUtxos(params: any): Promise<any[]>;
    export function getBalanceFromUtxos(utxos: any[]): number;
}

declare module 'privacycash/dist/utils/encryption' {
    export class EncryptionService {
        deriveEncryptionKeyFromSignature(signature: Uint8Array): void;
    }
}

declare module '@lightprotocol/hasher.rs' {
    export class WasmFactory {
        static getInstance(): Promise<any>;
    }
}
