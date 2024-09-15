# @futuretense/ot

## Oblivious Transfers in typescript

An Oblivious Transfer is a cryptographic protocol that allows a Sender to send information to a Receiver in a way such that
- the Receiver gets only the information they choose, and learns nothing about the rest
- the Sender learns nothing about what information the Receiver chose

In its simplest case, a 1-out-of-2 OT, the Sender has two messages, m0 and m1, and the Receiver can learn one of them, without the Sender knowing which one the Receiver picked.

This package provides the fundamental base OTs, and their extension, as well as a couple of protocols on top of them, for implementing two-party multiplications.

## The basic OTs

### Random Oblivous Transfer (ROT)

```
import { ROTSender, ROTReceiver } from '@futuretense/ot';

const s0 = new ROTSender();
const r0 = new ROTReceiver();

const A = s0.send_1();
const B = r0.recv(A);
s0.send_2(B);
```

### Oblivious Transfer Extension (OTE)

```
import { OTESender, OTEReceiver } from '@futuretense/ot';

const s1 = new OTESender(s0, 256);
const r1 = new OTEReceiver(r0, 256);
const e = s1.send();
r1.recv(e);
```

(This implements the 2022 update of the protocol from KOS15 for consistency checks, making it actively secure.)

## Two-party Multiplications

In these protocols, built on top of the earlier OTs, the Sender and Receiver each have a secret value; `a` and `b`, respectively.

Using a two-party multiplication, they can, without exposing their secrets to each other, transform them into a different pair of values, `x` and `y`, that adds up to `a * b`

    x + y = a * b

To save on communication rounds, the Receiver uses a random scalar, made up by the choice bits of the underlying OT, and finishes off by sending the difference between this and its wanted input to the Sender.

### Random Oblivious Linear Evaluation (ROLE)

In this protocol, the input of the Sender is a scalar, 

    import { ROLESender, ROLEReceiver } from '@futuretense/ot';
    import { secp256k1 } from '@futuretense/curves';

    const b = randomScalar();

    const s2 = new ROLESender(secp256k1, r1, b);
    const r2 = new ROLEReceiver(secp256k1, s1);

    const m = s2.send();
    r2.recv(m);

### Random Vector Oblivious Linear Evaluation (RVOLE)

In this protocol, the input of the Sender is a vector,

    import { RVOLESender, RVOLEReceiver } from '@futuretense/ot';
    import { secp256k1 } from '@futuretense/curves';

    const b = randomScalar();
    const c = randomScalar();

    const s2 = new RVOLESender(secp256k1, r1, [b, c]);
    const r2 = new RVOLEReceiver(secp256k1, s1);

    const m = s2.send();
    r2.recv(m);
