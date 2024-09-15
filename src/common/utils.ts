import {
    bytesToNumberBE,
    numberToBytesBE
} from '@noble/curves/abstract/utils';
import { concatBytes } from '@noble/hashes/utils';
import { Point } from '@futuretense/curves/';
import { sha256 as hash } from './hash.js';
import { mul } from './gf2_128.js';

export function crh(x: Uint8Array, i: number): Uint8Array {
    const h = hash(x);
    return xor(hash(xor(h, numberToBytesBE(i, 32))), h);
}

export function hashPoint(p: Point, i: number): Uint8Array {
    return crh(p.serialize(), i);
}

type ArrayType = {
    length: number;
    slice: (start: number, end: number) => any;
};

export function chunk<T extends ArrayType>(array: T, size: number): T[] {

    const length = array.length
    let index = 0;
    let outIndex = 0;

    const res = new Array(length / size);    
    while (index < length) {
        res[outIndex++] = array.slice(index, (index += size));
    }

    return res;
}

// Bitwise XOR
export function xor(x: Uint8Array, y: Uint8Array): Uint8Array {
    const bytes = new Uint8Array(x.length);

    for (var i = 0; i < bytes.length; i++) {
        bytes[i] = x[i] ^ y[i];
    }

    return bytes;
};

export function* iterbits(x: Uint8Array) {
    let xtemp = bytesToNumberBE(x);
    const n = x.length * 8;
    for (let i = n - 1; i >= 0; i--) {
        const bit = Number(xtemp & 1n);
        yield ([bit, i]);
        xtemp >>= 1n;
    }
}

export function bytesToBits(b: Uint8Array) {

    const res: number[] = [];
    b.forEach(x => {
        res.push(x >> 7);
        res.push((x >> 6) & 1);
        res.push((x >> 5) & 1);
        res.push((x >> 4) & 1);
        res.push((x >> 3) & 1);
        res.push((x >> 2) & 1);
        res.push((x >> 1) & 1);
        res.push(x & 1);
    });

    return Uint8Array.from(res);
}

export const range = (start: number, end: number) => Array.from({length: (end - start)}, (_, k) => k + start);

export function prf(seed: Uint8Array, offset: number, length: number): Uint8Array {

    const index0 = Math.floor(offset / 32);
    let start = offset % 32;

    const res: Uint8Array[] = [];
    for (let index = index0; length != 0; index++) {
        const h = hash(xor(seed, numberToBytesBE(index, 32)));
        const end = Math.min(start + length, 32);
        res.push(h.slice(start, end));
        length -= (end - start);
        start = 0;
    }

    return concatBytes(...res);
}

//
//      Linear Universal Hash from the updated KOS15, page 15
//

export function chihash(x: Uint8Array, chi: bigint[]): Uint8Array {
    const xprim = chunk(x, 16);

    let sum = bytesToNumberBE(xprim.slice(-1)[0]);
    for (let i = 0; i < chi.length; i++) {
        sum ^= mul(bytesToNumberBE(xprim[i]), chi[i])
    }

    return numberToBytesBE(sum, 16);
}

export function transpose(m: Uint8Array[]): Uint8Array[] {

    const width = m[0].length;

    const res = new Array(8 * width);
    for (let i = 0; i < 8 * width; i++) {
        res[i] = new Uint8Array(16);
    }

    for (let y = 0; y < 16; y++) {

        const offsety = 8 * y;
        const input = m.slice(offsety, offsety + 8);
        for (let x = 0; x < width; x++) {

            const a0 = input[0][x];
            const b0 = input[1][x];
            const c0 = input[2][x];
            const d0 = input[3][x];
            const e0 = input[4][x];
            const f0 = input[5][x];
            const g0 = input[6][x];
            const h0 = input[7][x];

            const a1 =  (a0 & 0xf0)       | ((e0 & 0xf0) >> 4);
            const e1 = ((a0 & 0x0f) << 4) |  (e0 & 0x0f);
            const b1 =  (b0 & 0xf0)       | ((f0 & 0xf0) >> 4);
            const f1 = ((b0 & 0x0f) << 4) |  (f0 & 0x0f);
            const c1 =  (c0 & 0xf0)       | ((g0 & 0xf0) >> 4);
            const g1 = ((c0 & 0x0f) << 4) |  (g0 & 0x0f);
            const d1 =  (d0 & 0xf0)       | ((h0 & 0xf0) >> 4);
            const h1 = ((d0 & 0x0f) << 4) |  (h0 & 0x0f);

            const a2 =  (a1 & 0xcc)       | ((c1 & 0xcc) >> 2);
            const c2 = ((a1 & 0x33) << 2) |  (c1 & 0x33);
            const b2 =  (b1 & 0xcc)       | ((d1 & 0xcc) >> 2);
            const d2 = ((b1 & 0x33) << 2) |  (d1 & 0x33);
            const e2 =  (e1 & 0xcc)       | ((g1 & 0xcc) >> 2);
            const g2 = ((e1 & 0x33) << 2) |  (g1 & 0x33);
            const f2 =  (f1 & 0xcc)       | ((h1 & 0xcc) >> 2);
            const h2 = ((f1 & 0x33) << 2) |  (h1 & 0x33);

            const a3 =  (a2 & 0xaa)       | ((b2 & 0xaa) >> 1);
            const b3 = ((a2 & 0x55) << 1) |  (b2 & 0x55);
            const c3 =  (c2 & 0xaa)       | ((d2 & 0xaa) >> 1);
            const d3 = ((c2 & 0x55) << 1) |  (d2 & 0x55);
            const e3 =  (e2 & 0xaa)       | ((f2 & 0xaa) >> 1);
            const f3 = ((e2 & 0x55) << 1) |  (f2 & 0x55);
            const g3 =  (g2 & 0xaa)       | ((h2 & 0xaa) >> 1);
            const h3 = ((g2 & 0x55) << 1) |  (h2 & 0x55);

            const offsetx = 8 * x;
            const output = res.slice(offsetx, offsetx + 8);
            output[0][y] = a3;
            output[1][y] = b3;
            output[2][y] = c3;
            output[3][y] = d3;
            output[4][y] = e3;
            output[5][y] = f3;
            output[6][y] = g3;
            output[7][y] = h3;
        }    
    }

    return res;
}
