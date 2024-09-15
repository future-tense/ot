import test from 'ava';

import { ot } from './base/data.js';

import {
    OTESender,
    OTEReceiver
} from './base/ote.js';

import {
    ROLESender,
    ROLEReceiver,
} from './role.js';

import { ed25519, secp256k1 } from '@futuretense/curves';

function basecase(curve, t) {

    const {
        fp,
        randomScalar
    } = curve;

    const s0 = new OTESender(ot.sender, 256);
    const r0 = new OTEReceiver(ot.receiver, 256);

    const e = s0.send();
    t.notThrows(() => r0.recv(e));

    //
    //
    //

    const a = randomScalar();
    const b = randomScalar();

    const s1 = new ROLESender(curve, r0, b);
    const r1 = new ROLEReceiver(curve, s0);

    const m = s1.send();
    r1.recv(m);

    const adjustment = fp.sub(a, r1.choice);
    const adjustB = fp.mul(adjustment, b);

    t.is(fp.add(s1.y, r1.x), fp.mul(r1.choice, b));
    t.is(fp.add(fp.add(s1.y, r1.x), adjustB), fp.mul(a, b));
}

test('secp256k1 role', t => {
    basecase(secp256k1, t);
});

test('ed25519 role', t => {
    basecase(ed25519, t);
});
