import test from 'ava';

import { ot } from './base/data.js';

import {
    OTESender,
    OTEReceiver
} from './base/ote.js';

import {
    RVOLESender,
    RVOLEReceiver,
} from './rvole.js';

import { secp256k1, ed25519 } from '@futuretense/curves';

function basecase(curve, t) {

    const {
        fp,
        randomScalar
    } = curve;

    const s0 = new OTESender(ot.sender, 256);
    const r0 = new OTEReceiver(ot.receiver, 256);

    const e = s0.send();        //  8240 bytes
    t.notThrows(() => r0.recv(e));

    //
    //
    //

    const b = randomScalar();
    const c = randomScalar();

    const s1 = new RVOLESender(curve, r0, [b, c]);
    const r1 = new RVOLEReceiver(curve, s0);

    const m = s1.send();        //  8192 bytes
    r1.recv(m);

    t.is(fp.add(s1.y[0], r1.x[0]), fp.mul(r1.choice, b));
    t.is(fp.add(s1.y[1], r1.x[1]), fp.mul(r1.choice, c));

    const a = randomScalar();
    const adjustment = fp.sub(a, r1.choice);
    const adjustB = fp.mul(adjustment, b);
    const adjustC = fp.mul(adjustment, c);

    t.is(fp.add(fp.add(s1.y[0], r1.x[0]), adjustB), fp.mul(a, b));
    t.is(fp.add(fp.add(s1.y[1], r1.x[1]), adjustC), fp.mul(a, c));
}

test('secp256k1 rvole', t => {
    basecase(secp256k1, t);
});

test('ed25519 rvole', t => {
    basecase(ed25519, t);
});
