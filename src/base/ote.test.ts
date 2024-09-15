import test from 'ava';

import {
    OTESender,
    OTEReceiver
} from './ote.js';

import { ot } from './data.js'
import { iterbits } from '../common/utils.js';
import { equals } from 'uint8arrays/equals';

/*
    s - receiver choice bits
    r - sender choice bits
    r_i - sender choice bit #i
    q_i - row #i in receiver output
    t_i - row #i in sender output

    r_i | q_i
    ----+-----
     0  | t(i)
     1  | t(i) + s
*/

test('test', t => {

    const n = 256;
    const s0 = new OTESender(ot.sender, n);
    const r0 = new OTEReceiver(ot.receiver, n);
    const e = s0.send();
    t.notThrows(() => r0.recv(e));

    t.is(r0.base.choice.length * 8, 128);
    t.is(s0.choice.length * 8, n);
    t.is(s0.ec.length, n);
    t.is(r0.e.length, n);

    for (const [cb, i] of iterbits(s0.choice)) {
        t.assert(equals(r0.e[i][cb], s0.ec[i]));
    }
});
