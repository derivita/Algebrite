import { alloc_tensor } from '../runtime/alloc';
import {
  car,
  cdr,
  defs,
  INNER,
  isadd,
  iscons,
  isinnerordot,
  isNumericAtom,
  isNumericAtomOrTensor,
  istensor,
  MAXDIM,
  NIL,
  symbol,
  SYMBOL_IDENTITY_MATRIX,
  Tensor,
  U,
} from '../runtime/defs';
import { stop } from '../runtime/run';
import { pop, push, swap } from '../runtime/stack';
import { push_symbol } from '../runtime/symbol';
import { add, subtract } from './add';
import { Eval } from './eval';
import { inv } from './inv';
import { isnegativeterm, isZeroAtomOrTensor } from './is';
import { list } from './list';
import { multiply, negate } from './multiply';
import { scalar_times_tensor, tensor_times_scalar } from './tensor';
/* dot =====================================================================

Tags
----
scripting, JS, internal, treenode, general concept

Parameters
----------
a,b,...

General description
-------------------

The inner (or dot) operator gives products of vectors,
matrices, and tensors.

Note that for Algebrite, the elements of a vector/matrix
can only be scalars. This allows for example to flesh out
matrix multiplication using the usual multiplication.
So for example block-representations are not allowed.

There is an aweful lot of confusion between sw packages on
what dot and inner do.

First off, the "dot" operator is different from the
mathematical notion of dot product, which can be
slightly confusing.

The mathematical notion of dot product is here:
  http://mathworld.wolfram.com/DotProduct.html

However, "dot" does that and a bunch of other things,
i.e. in Algebrite
dot/inner does what the dot of Mathematica does, i.e.:

scalar product of vectors:

  inner((a, b, c), (x, y, z))
  > a x + b y + c z

products of matrices and vectors:

  inner(((a, b), (c,d)), (x, y))
  > (a x + b y,c x + d y)

  inner((x, y), ((a, b), (c,d)))
  > (a x + c y,b x + d y)

  inner((x, y), ((a, b), (c,d)), (r, s))
  > a r x + b s x + c r y + d s y

matrix product:

  inner(((a,b),(c,d)),((r,s),(t,u)))
  > ((a r + b t,a s + b u),(c r + d t,c s + d u))

the "dot/inner" operator is associative and
distributive but not commutative.

In Mathematica, Inner is a generalisation of Dot where
the user can specify the multiplication and the addition
operators.
But here in Algebrite they do the same thing.

 https://reference.wolfram.com/language/ref/Dot.html
 https://reference.wolfram.com/language/ref/Inner.html

 http://uk.mathworks.com/help/matlab/ref/dot.html
 http://uk.mathworks.com/help/matlab/ref/mtimes.html

*/
export function Eval_inner(p1: U) {
  // if there are more than two arguments then
  // reduce it to a more standard version
  // of two arguments, which means we need to
  // transform the arguments into a tree of
  // inner products e.g.
  // inner(a,b,c) becomes inner(a,inner(b,c))
  // this is so we can get to a standard binary-tree
  // version that is simpler to manipulate.
  const theArguments: U[] = [];
  theArguments.push(car(cdr(p1)));
  const secondArgument = car(cdr(cdr(p1)));
  if (secondArgument === symbol(NIL)) {
    stop('pattern needs at least a template and a transformed version');
  }

  let moretheArguments = cdr(cdr(p1));
  while (moretheArguments !== symbol(NIL)) {
    theArguments.push(car(moretheArguments));
    moretheArguments = cdr(moretheArguments);
  }

  // make it so e.g. inner(a,b,c) becomes inner(a,inner(b,c))
  if (theArguments.length > 2) {
    push_symbol(INNER);
    push(theArguments[theArguments.length - 2]);
    push(theArguments[theArguments.length - 1]);
    list(3);
    for (let i = 2; i < theArguments.length; i++) {
      push_symbol(INNER);
      swap();
      push(theArguments[theArguments.length - i - 1]);
      swap();
      list(3);
    }
    p1 = pop();
    Eval_inner(p1);
    return;
  }

  // TODO we have to take a look at the whole
  // sequence of operands and make simplifications
  // on that...
  let operands: U[] = [];
  get_innerprod_factors(p1, operands);

  //console.log "printing operands --------"
  //for i in [0...operands.length]
  //  console.log "operand " + i + " : " + operands[i]

  let refinedOperands: U[] = [];
  // removing all identity matrices
  for (let i = 0; i < operands.length; i++) {
    if (operands[i] === symbol(SYMBOL_IDENTITY_MATRIX)) {
      continue;
    } else {
      refinedOperands.push(operands[i]);
    }
  }
  operands = refinedOperands;

  refinedOperands = [];
  if (operands.length > 1) {
    let shift = 0;
    for (let i = 0; i < operands.length; i++) {
      //console.log "comparing if " + operands[i+shift] + " and " + operands[i+shift+1] + " are inverses of each other"
      if (i + shift + 1 <= operands.length - 1) {
        //console.log "isNumericAtomOrTensor " + operands[i+shift] + " : " + isNumericAtomOrTensor(operands[i+shift])
        //console.log "isNumericAtomOrTensor " + operands[i+shift+1] + " : " + isNumericAtomOrTensor(operands[i+shift+1])
        if (
          !(
            isNumericAtomOrTensor(operands[i + shift]) ||
            isNumericAtomOrTensor(operands[i + shift + 1])
          )
        ) {
          push(operands[i + shift]);
          Eval();
          inv();
          push(operands[i + shift + 1]);
          Eval();
          subtract();
          const difference = pop();
          //console.log "result: " + difference
          if (isZeroAtomOrTensor(difference)) {
            shift += 1;
          } else {
            refinedOperands.push(operands[i + shift]);
          }
        } else {
          refinedOperands.push(operands[i + shift]);
        }
      } else {
        break;
      }

      //console.log "i: " + i + " shift: " + shift + " operands.length: " + operands.length

      if (i + shift === operands.length - 2) {
        //console.log "adding last operand 2 "
        refinedOperands.push(operands[operands.length - 1]);
      }
      if (i + shift >= operands.length - 1) {
        break;
      }
    }
    operands = refinedOperands;
  }

  //console.log "refined operands --------"
  //for i in [0...refinedOperands.length]
  //  console.log "refined operand " + i + " : " + refinedOperands[i]

  //console.log "stack[tos-1]: " + stack[tos-1]

  // now rebuild the arguments, just using the
  // refined operands
  push(symbol(INNER));
  //console.log "rebuilding the argument ----"

  if (operands.length > 0) {
    for (let i = 0; i < operands.length; i++) {
      //console.log "pushing " + operands[i]
      push(operands[i]);
    }
  } else {
    pop();
    push(symbol(SYMBOL_IDENTITY_MATRIX));
    return;
  }
  //console.log "list(operands.length): " + (operands.length+1)
  list(operands.length + 1);
  p1 = pop();

  p1 = cdr(p1);
  push(car(p1));
  Eval();
  p1 = cdr(p1);

  while (iscons(p1)) {
    push(car(p1));
    Eval();
    inner();
    p1 = cdr(p1);
  }
}

// inner definition
export function inner() {
  let p2 = pop();
  let p1 = pop();

  // more in general, when a and b are scalars,
  // inner(a*M1, b*M2) is equal to
  // a*b*inner(M1,M2), but of course we can only
  // "bring out" in a and b the scalars, because
  // it's the only commutative part.
  // that's going to be trickier to do in general
  // but let's start with just the signs.
  if (isnegativeterm(p2) && isnegativeterm(p1)) {
    push(p2);
    negate();
    p2 = pop();
    push(p1);
    negate();
    p1 = pop();
  }

  // since inner is associative,
  // put it in a canonical form i.e.
  // inner(inner(a,b),c) ->
  // inner(a,inner(b,c))
  // so that we can recognise when they
  // are equal.
  if (isinnerordot(p1)) {
    const arg1 = car(cdr(p1)); //a
    const arg2 = car(cdr(cdr(p1))); //b
    const arg3 = p2;
    p1 = arg1;
    push(arg2);
    push(arg3);
    inner();
    p2 = pop();
  }

  // Check if one of the operands is the identity matrix
  // we could maybe use Eval_testeq here but
  // this seems to suffice?
  if (p1 === symbol(SYMBOL_IDENTITY_MATRIX)) {
    push(p2);
    return;
  } else if (p2 === symbol(SYMBOL_IDENTITY_MATRIX)) {
    push(p1);
    return;
  }

  if (istensor(p1) && istensor(p2)) {
    inner_f(p1, p2);
  } else {
    // simple check if the two consecutive elements are one the
    // (symbolic) inv of the other. If they are, the answer is
    // the identity matrix
    if (!(isNumericAtomOrTensor(p1) || isNumericAtomOrTensor(p2))) {
      push(p1);
      push(p2);
      inv();
      subtract();
      const subtractionResult = pop();
      if (isZeroAtomOrTensor(subtractionResult)) {
        push_symbol(SYMBOL_IDENTITY_MATRIX);
        return;
      }
    }

    // if either operand is a sum then distribute
    // (if we are in expanding mode)
    if (defs.expanding && isadd(p1)) {
      p1 = cdr(p1);
      push(defs.zero);
      while (iscons(p1)) {
        push(car(p1));
        push(p2);
        inner();
        add();
        p1 = cdr(p1);
      }
      return;
    }

    if (defs.expanding && isadd(p2)) {
      p2 = cdr(p2);
      push(defs.zero);
      while (iscons(p2)) {
        push(p1);
        push(car(p2));
        inner();
        add();
        p2 = cdr(p2);
      }
      return;
    }

    push(p1);
    push(p2);

    // there are 8 remaining cases here, since each of the
    // two arguments can only be a scalar/tensor/unknown
    // and the tensor - tensor case was caught
    // upper in the code
    if (istensor(p1) && isNumericAtom(p2)) {
      // one case covered by this branch:
      //   tensor - scalar
      tensor_times_scalar();
    } else if (isNumericAtom(p1) && istensor(p2)) {
      // one case covered by this branch:
      //   scalar - tensor
      scalar_times_tensor();
    } else if (isNumericAtom(p1) || isNumericAtom(p2)) {
      // three cases covered by this branch:
      //   unknown - scalar
      //   scalar - unknown
      //   scalar  - scalar
      // in these cases a normal multiplication
      // will be OK
      multiply();
    } else {
      // three cases covered by this branch:
      //   unknown - unknown
      //   unknown - tensor
      //   tensor  - unknown
      // in this case we can't use normal
      // multiplication.
      pop();
      pop();
      push_symbol(INNER);
      push(p1);
      push(p2);
      list(3);
      return;
    }
  }
}

// inner product of tensors p1 and p2
function inner_f(p1: Tensor, p2: Tensor) {
  const n = p1.tensor.dim[p1.tensor.ndim - 1];
  if (n !== p2.tensor.dim[0]) {
    debugger;
    stop('inner: tensor dimension check');
  }

  const ndim = p1.tensor.ndim + p2.tensor.ndim - 2;

  if (ndim > MAXDIM) {
    stop('inner: rank of result exceeds maximum');
  }

  const a = p1.tensor.elem;
  const b = p2.tensor.elem;

  //---------------------------------------------------------------------
  //
  //  ak is the number of rows in tensor A
  //
  //  bk is the number of columns in tensor B
  //
  //  Example:
  //
  //  A[3][3][4] B[4][4][3]
  //
  //    3  3        ak = 3 * 3 = 9
  //
  //                  4  3    bk = 4 * 3 = 12
  //
  //---------------------------------------------------------------------
  let ak = 1;
  for (let i = 0; i < p1.tensor.ndim - 1; i++) {
    ak *= p1.tensor.dim[i];
  }

  let bk = 1;
  for (let i = 1; i < p2.tensor.ndim; i++) {
    bk *= p2.tensor.dim[i];
  }

  const p3 = alloc_tensor(ak * bk);

  const c = p3.tensor.elem;

  // new method copied from ginac http://www.ginac.de/
  for (let i = 0; i < ak; i++) {
    for (let j = 0; j < n; j++) {
      if (isZeroAtomOrTensor(a[i * n + j])) {
        continue;
      }
      for (let k = 0; k < bk; k++) {
        push(a[i * n + j]);
        push(b[j * bk + k]);
        multiply();
        push(c[i * bk + k]);
        add();
        c[i * bk + k] = pop();
      }
    }
  }

  //---------------------------------------------------------------------
  //
  //  Note on understanding "k * bk + j"
  //
  //  k * bk because each element of a column is bk locations apart
  //
  //  + j because the beginnings of all columns are in the first bk
  //  locations
  //
  //  Example: n = 2, bk = 6
  //
  //  b111  <- 1st element of 1st column
  //  b112  <- 1st element of 2nd column
  //  b113  <- 1st element of 3rd column
  //  b121  <- 1st element of 4th column
  //  b122  <- 1st element of 5th column
  //  b123  <- 1st element of 6th column
  //
  //  b211  <- 2nd element of 1st column
  //  b212  <- 2nd element of 2nd column
  //  b213  <- 2nd element of 3rd column
  //  b221  <- 2nd element of 4th column
  //  b222  <- 2nd element of 5th column
  //  b223  <- 2nd element of 6th column
  //
  //---------------------------------------------------------------------
  if (ndim === 0) {
    push(p3.tensor.elem[0]);
  } else {
    p3.tensor.ndim = ndim;
    for (let i = 0; i < p1.tensor.ndim - 1; i++) {
      p3.tensor.dim[i] = p1.tensor.dim[i];
    }
    const j = p1.tensor.ndim - 1;
    for (let i = 0; i < p2.tensor.ndim - 1; i++) {
      p3.tensor.dim[j + i] = p2.tensor.dim[i + 1];
    }
    push(p3);
  }
}

// Algebrite.run('c·(b+a)ᵀ·inv((a+b)ᵀ)·d').toString();
// Algebrite.run('c*(b+a)ᵀ·inv((a+b)ᵀ)·d').toString();
// Algebrite.run('(c·(b+a)ᵀ)·(inv((a+b)ᵀ)·d)').toString();
function get_innerprod_factors(tree: U, factors_accumulator: U[]): void {
  // console.log "extracting inner prod. factors from " + tree

  if (!iscons(tree)) {
    add_factor_to_accumulator(tree, factors_accumulator);
    return;
  }

  if (cdr(tree) === symbol(NIL)) {
    get_innerprod_factors(car(tree), factors_accumulator);
    return;
  }

  if (isinnerordot(tree)) {
    // console.log "there is inner at top, recursing on the operands"
    get_innerprod_factors(car(cdr(tree)), factors_accumulator);
    get_innerprod_factors(cdr(cdr(tree)), factors_accumulator);
    return;
  }

  add_factor_to_accumulator(tree, factors_accumulator);
}

function add_factor_to_accumulator(tree: U, factors_accumulator: U[]): void {
  if (tree !== symbol(NIL)) {
    // console.log ">> adding to factors_accumulator: " + tree
    factors_accumulator.push(tree);
  }
}
