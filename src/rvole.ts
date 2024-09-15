import { Scalar, Curve } from '@futuretense/curves';
import { BaseOTSend, BaseOTRecv } from './base/types.js';
import { iterbits, chunk, crh } from './common/utils.js';
import { bytesToNumberBE } from '@noble/curves/abstract/utils';

export class RVOLESender {

    curve: Curve;
    base: BaseOTSend;
    b: Scalar[];
    y: Scalar[];

    constructor(curve: Curve, base: BaseOTSend, b: Scalar[]) {
        this.curve = curve;
        this.base = base;
        this.b = b;
    }

    send(): Uint8Array[] {

        const {
            fp,
            serializeScalar,
            deserializeScalar
        } = this.curve;

        const y: Scalar[] = [];
        const res: Uint8Array[] = [];
        for (let n = 0; n < this.b.length; n++) {
            let ysum = 0n;
            let btemp = this.b[n] << 255n;
            for (let i = 0; i < 256; i++) {
                const [k0, k1] = this.base.e[i];
                const t0 = deserializeScalar(crh(k0, n));
                const t1 = deserializeScalar(crh(k1, n));
                const tplusx = fp.add(t0, btemp);
                const u = t1 ^ tplusx;
                res.push(serializeScalar(u));
                btemp >>= 1n;
                ysum = fp.sub(ysum, t0);
            }

            y.push(ysum);
        }

        this.y = y;
        return res;
    }
}

export class RVOLEReceiver {

    curve: Curve;
    base: BaseOTRecv;
    x: Scalar[];
    choice: Scalar;

    constructor(curve: Curve, base: BaseOTRecv) {
        this.curve = curve;
        this.base = base;
        this.choice = bytesToNumberBE(base.choice.slice(0, 32));
    }

    recv(e: Uint8Array[]) {

        const {
            fp,
            deserializeScalar
        } = this.curve;

        const choice = this.base.choice.slice(0, 32);

        const x: Scalar[] = [];
        for (let n = 0; n < (e.length >> 8); n++) {
            let xsum = 0n;
            for (const [cb, i] of iterbits(choice)) {
                const t = deserializeScalar(crh(this.base.ec[i], n));
                const u = deserializeScalar(e[256*n + i]);
                const q = (cb === 0) ? t : u ^ t;
                xsum = fp.add(xsum, q);
            }
    
            x.push(xsum);
        }

        this.x = x;
    }
}
