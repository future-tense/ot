import { concatBytes } from '@noble/hashes/utils';
import { bytesToNumberBE } from '@noble/curves/abstract/utils';
import { sha256 as hash } from '../common/hash.js';
import { xor, iterbits, prf, transpose, chunk, chihash, crh } from '../common/utils.js';
import { BaseOTRecv, BaseOTSend } from './types.js';
import secureRandom from 'secure-random';
import { equals } from 'uint8arrays/equals';

export type OTEMessage = {
    seed: Uint8Array;
    xhash: Uint8Array;
    thash: Uint8Array[];
    u: Uint8Array[];
}

function marshall_OTEMessage(msg: OTEMessage): Uint8Array {
    return concatBytes(
        msg.seed,
        msg.xhash,
        ...msg.u,
        ...msg.thash
    );
}

function unmarshall_OTEMessage(msg: Uint8Array, n: number): OTEMessage {
    const offset = 48 + 128 * n;

    return {
        seed: msg.slice(0, 32),
        xhash: msg.slice(32, 48),
        u: chunk(msg.slice(48, offset), n),
        thash: chunk(msg.slice(offset), 16)
    }
}

function chiFromSeed(seed: Uint8Array, n: number): bigint[] {
    return chunk(prf(seed, 0, n), 16).map(x => bytesToNumberBE(x));
}

export class OTESender implements BaseOTRecv {

    readonly n: number;
    readonly base: BaseOTSend;
    choice: Uint8Array;
    ec: Uint8Array[];

    constructor(base: BaseOTSend, n: number) {
        this.base = base;
        this.n = n;
    }

    send(): Uint8Array {

        const n = this.n >> 3;
        const choice = secureRandom.randomUint8Array(n + 16);
        const seed = secureRandom.randomUint8Array(32);
        const chi = chiFromSeed(seed, n);
        const xhash = chihash(choice, chi);
        const offset = hash(seed);

        const tcol: Uint8Array[] = [];
        const u: Uint8Array[] = [];
        for (let i = 0; i < 128; i++) {
            const [k0, k1] = this.base.e[i];
            const t0 = prf(xor(k0, offset), 0, n + 16);
            const t1 = prf(xor(k1, offset), 0, n + 16);
            tcol.push(t0);

            const ui = xor(xor(t0, t1), choice);
            u.push(ui);
        }

        const thash = tcol.map(x => chihash(x, chi));

        //  adjust output lengths
        this.choice = choice.slice(0, n);

        const trow = transpose(tcol.map(x => x.slice(0, n)));
        this.ec = trow.map(row => hash(row));

        return marshall_OTEMessage({
            seed,                           //  32
            xhash,                          //  16
            thash,                          //  128 * 16
            u,                              //  128 * ((n >> 3) + 16)
        });
    }
}

export class OTEReceiver implements BaseOTSend {

    readonly n: number;
    readonly choice: Uint8Array;
    readonly base: BaseOTRecv;
    e: Uint8Array[][];

    constructor(base: BaseOTRecv, n: number) {
        this.base = base;
        this.choice = base.choice;
        this.n = n;
    }

    recv(m: Uint8Array) {

        const n = this.n >> 3;
        const { seed, xhash, u, thash } = unmarshall_OTEMessage(m, n + 16);
        const qcol: Uint8Array[] = new Array(128);
        const offset = hash(seed);

        for (const [cb, i] of iterbits(this.base.choice)) {
            const k = this.base.ec[i];
            const t = prf(xor(k, offset), 0, n + 16);
            qcol[i] = (cb === 0) ? t : xor(u[i], t);
        }

        //
        //  consistency check
        //

        const chi = chiFromSeed(seed, n);
        for (const [cb, i] of iterbits(this.base.choice)) {
            const lhs = (cb === 0) ? thash[i] : xor(thash[i], xhash);
            const rhs = chihash(qcol[i], chi);
            if (!equals(lhs, rhs)) {
                throw 'error';
            }
        }

        const qrow = transpose(qcol.map(x => x.slice(0, n)));

        const rc = this.base.choice;
        this.e = qrow.map(
            row => [hash(row), hash(xor(row, rc))]
        );
    }
}
