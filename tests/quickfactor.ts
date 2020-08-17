import { equal } from '../sources/misc';
import { defs, primetab } from '../runtime/defs';
import { pop } from '../runtime/stack';
import { push_integer } from '../sources/bignum';
import { multiply_all } from '../sources/multiply';
import { quickfactor, quickpower } from '../sources/quickfactor';
import { test } from '../test-harness';

test('quickfactor', t => {
  for (let i = 2; i < 10001; i++) {
    let base = i;
    push_integer(base);
    push_integer(1);
    quickfactor();
    const h = defs.tos;
    let j = 0;
    while (base > 1) {
      let expo = 0;
      while (base % primetab[j] === 0) {
        base /= primetab[j];
        expo++;
      }
      if (expo) {
        push_integer(primetab[j]);
        push_integer(expo);
        quickpower();
      }
      j++;
    }
    multiply_all(defs.tos - h);
    defs.p2 = pop();
    defs.p1 = pop();
    t.is(true, equal(defs.p1, defs.p2), `${defs.p1} != ${defs.p2}`);
  }
});
