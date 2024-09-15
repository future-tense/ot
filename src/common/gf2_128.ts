//  irreducible polynomial, from AES-GCM
const p = ((1n << 128n) + 135n) << 127n;

//  GF(2^128) multiplication
export function mul(x: bigint, y: bigint): bigint {

    let sum = 0n;
    for (let i = 0; i < 128; i++) {
        if (y & 1n) {
            sum ^= x;
        }
        x <<= 1n;
        y >>= 1n;
    }

    let red = p;
    let bit = 1n << 255n;
    for (let i = 0; i < 128; i++) {
        if (sum & bit) {
            sum ^= red;
        }
        red >>= 1n;
        bit >>= 1n;
    }

    return sum;
}
