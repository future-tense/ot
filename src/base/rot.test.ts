import test from 'ava';

import {
    ROTSender,
    ROTReceiver
} from './rot.js';

import { equals } from 'uint8arrays/equals';
import { iterbits } from '../common/utils.js';

test('test', t => {

    const s = new ROTSender();
    const r = new ROTReceiver();

    const A = s.send_1();
    const B = r.recv(A);
    s.send_2(B);

    for (const [cb, i] of iterbits(r.choice)) {
        t.assert(equals(s.e[i][cb], r.ec[i]));
    }
});