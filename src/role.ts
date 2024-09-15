import { Scalar, Curve } from '@futuretense/curves';
import { BaseOTSend, BaseOTRecv } from './base/types.js';
import { iterbits } from './common/utils.js';
import { bytesToNumberBE } from '@noble/curves/abstract/utils';

export class ROLESender {

    curve: Curve;
    base: BaseOTSend;
    b: Scalar;
    y: Scalar;

    constructor(curve: Curve, base: BaseOTSend, b: Scalar) {
        this.curve = curve;
        this.base = base;
        this.b = b;
    }

    send(): Uint8Array[] {

        const {
            fp,
            serializeScalar,
            deserializeScalar,
        } = this.curve;

        let ysum = 0n;
        let btemp = this.b << 255n;
        const e: Uint8Array[] = [];
        for (let i = 0; i < 256; i++) {
            const [k0, k1] = this.base.e[i];
            const t0 = deserializeScalar(k0);
            const t1 = deserializeScalar(k1);
            const tplusx = fp.add(t0, btemp);
            const u = t1 ^ tplusx;
            e.push(serializeScalar(u));
            btemp >>= 1n;
            ysum = fp.sub(ysum, t0);
        }

        this.y = ysum;
        return e;
    }
}

export class ROLEReceiver {

    curve: Curve;
    base: BaseOTRecv;
    x: Scalar;
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

        let xsum = 0n;
        let choice = this.base.choice.slice(0, 32);
        for (const [cb, i] of iterbits(choice)) {
            const u = deserializeScalar(e[i]);
            const t = deserializeScalar(this.base.ec[i]);
            const q = (cb === 0) ? t : u ^ t;
            xsum = fp.add(xsum, q);
        }

        this.x = xsum;
    }
}
