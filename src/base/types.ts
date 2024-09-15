export type BaseOTRecv = {
    choice: Uint8Array;
    ec: Uint8Array[];
}

export type BaseOTSend = {
    e: Uint8Array[][];
}
