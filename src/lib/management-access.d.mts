export const MANAGEMENT_ORIGIN: string;
export function validBridgeMessage(event: {origin:string;source:unknown;data?:{nonce?:string;type?:string}}, popup:unknown, nonce:string): boolean;
export function connectManagement(getSession:()=>Promise<{data:{session:unknown};error:unknown}>,target?:Window):Promise<void>;
