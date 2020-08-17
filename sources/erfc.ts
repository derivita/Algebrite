import { cadr, defs, ERFC, isdouble, U } from '../runtime/defs';
import { pop, push } from '../runtime/stack';
import { push_symbol } from '../runtime/symbol';
import { push_double } from './bignum';
import { Eval } from './eval';
import { isZeroAtomOrTensor } from './is';
import { list } from './list';
//-----------------------------------------------------------------------------
//
//  Author : philippe.billet@noos.fr
//
//  erfc(x)
//
//  GW  Added erfc() from Numerical Recipes in C
//
//-----------------------------------------------------------------------------
export function Eval_erfc(p1: U) {
  push(cadr(p1));
  Eval();
  yerfc();
}

function yerfc() {
  yyerfc();
}

function yyerfc() {
  const p1 = pop();

  if (isdouble(p1)) {
    const d = erfc(p1.d);
    push_double(d);
    return;
  }

  if (isZeroAtomOrTensor(p1)) {
    push(defs.one);
    return;
  }

  push_symbol(ERFC);
  push(p1);
  list(2);
}

// from Numerical Recipes in C
export function erfc(x: number) {
  if (x === 0) {
    return 1.0;
  }

  const z = Math.abs(x);
  const t = 1.0 / (1.0 + 0.5 * z);

  const ans =
    t *
    Math.exp(
      -z * z -
        1.26551223 +
        t *
          (1.00002368 +
            t *
              (0.37409196 +
                t *
                  (0.09678418 +
                    t *
                      (-0.18628806 +
                        t *
                          (0.27886807 +
                            t *
                              (-1.13520398 +
                                t *
                                  (1.48851587 +
                                    t * (-0.82215223 + t * 0.17087277))))))))
    );

  if (x >= 0.0) {
    return ans;
  } else {
    return 2.0 - ans;
  }
}
