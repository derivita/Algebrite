import {
  symbol,
  SYMBOL_S,
  SYMBOL_T,
  SYMBOL_X,
  SYMBOL_Y,
  SYMBOL_Z,
} from '../runtime/defs';
import { Find } from '../runtime/find';
import { pop, push } from '../runtime/stack';
import { push_symbol } from '../runtime/symbol';
// Guess which symbol to use for derivative, integral, etc.
export function guess() {
  const p = pop();
  push(p);
  if (Find(p, symbol(SYMBOL_X))) {
    push_symbol(SYMBOL_X);
  } else if (Find(p, symbol(SYMBOL_Y))) {
    push_symbol(SYMBOL_Y);
  } else if (Find(p, symbol(SYMBOL_Z))) {
    push_symbol(SYMBOL_Z);
  } else if (Find(p, symbol(SYMBOL_T))) {
    push_symbol(SYMBOL_T);
  } else if (Find(p, symbol(SYMBOL_S))) {
    push_symbol(SYMBOL_S);
  } else {
    push_symbol(SYMBOL_X);
  }
}
