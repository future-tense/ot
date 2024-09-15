
import { sha256 as _sha256 } from '@noble/hashes/sha256';
import { sha512 as _sha512 } from '@noble/hashes/sha512';
import { concatBytes } from '@noble/hashes/utils';

//import { createHash } from 'node:crypto';

export function sha256(...args): Uint8Array {
    return _sha256(concatBytes(...args));
//    return createHash('sha256').update(concatBytes(...args)).digest();
}

export function sha512(...args): Uint8Array {
    return _sha512(concatBytes(...args));
}
