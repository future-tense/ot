import { Scalar, Point } from '@futuretense/curves';
import { base, zero, randomScalar, deserializePoint } from '@futuretense/curves/ed25519';
import { hashPoint, iterbits } from '../common/utils.js';
import secureRandom from 'secure-random';

export class ROTSender {

    a: Scalar;
    aaG: Point;
    e: Uint8Array[][];
    n: number;

    constructor(n: number = 128) {
        this.n = n;
    }

    send_1(): Uint8Array {
        const a = randomScalar();
        const aG = base.multiply(a);

        this.a = a;
        this.aaG = aG.multiply(a);

        return aG.serialize();
    }

    send_2(B: Uint8Array[]) {
        const { a, aaG, n } = this;

        const e: Uint8Array[][] = new Array(n);
        for (let i = 0; i < n; i++) {
            const abG = deserializePoint(B[i]).multiply(a);
            const k0 = hashPoint(abG, i);
            const k1 = hashPoint(abG.subtract(aaG), i);
            e[i] = [k0, k1];
        }

        this.e = e;
    }
}

//              choice = 0                          choice = 1
//  sender sends
//                  A                                     A
//  receiver sends
//                  bG                                 bG + A
//
//      x0 ^ H(baG) | x1 ^ H(baG - aaG)     x0 ^ H(baG + aaG) | x1 ^ H(baG)
//      ec = H(baG)

function select(P: Point, s: number): Point {
    return s === 0 ? zero : P;
}

export class ROTReceiver {

    choice: Uint8Array;
    ec: Uint8Array[];
    n: number;

    constructor(n: number = 128) {
        this.n = n;
    }

    recv(A: Uint8Array): Uint8Array[] {

        const { n } = this;

        const _A = deserializePoint(A);
        const ec: Uint8Array[] = new Array(n);
        const B: Uint8Array[] = new Array(n);

        const choice = secureRandom.randomUint8Array(n >> 3);
        for (const [cb, i] of iterbits(choice)) {
            const b = randomScalar();
            ec[i] = hashPoint(_A.multiply(b), i);
            B[i] = base.multiply(b).add(select(_A, cb)).serialize();
        }

        this.ec = ec;
        this.choice = choice;
        return B;
    }
}
