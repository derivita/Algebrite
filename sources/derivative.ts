import {
  ABS,
  ARCCOS,
  ARCCOSH,
  ARCSIN,
  ARCSINH,
  ARCTAN,
  ARCTANH,
  BESSELJ,
  BESSELY,
  caddr,
  cadr,
  car,
  cdr,
  COS,
  COSH,
  defs,
  DERIVATIVE,
  ERF,
  ERFC,
  HERMITE,
  INTEGRAL,
  isadd,
  iscons,
  isNumericAtom,
  issymbol,
  istensor,
  LOG,
  MULTIPLY,
  NIL,
  PI,
  POWER,
  SECRETX,
  SGN,
  SIN,
  SINH,
  symbol,
  TAN,
  TANH,
  U,
} from '../runtime/defs';
import { Find } from '../runtime/find';
import { stop } from '../runtime/run';
import { pop, push } from '../runtime/stack';
import { push_symbol } from '../runtime/symbol';
import { equal, exponential, length, lessp } from '../sources/misc';
import { add, add_all, subtract } from './add';
import { besselj } from './besselj';
import { bessely } from './bessely';
import {
  pop_integer,
  push_double,
  push_integer,
  push_rational,
} from './bignum';
import { cosine } from './cos';
import { ycosh } from './cosh';
import { dirac } from './dirac';
import { Eval } from './eval';
import { guess } from './guess';
import { hermite } from './hermite';
import { integral } from './integral';
import { isZeroAtomOrTensor } from './is';
import { list } from './list';
import { logarithm } from './log';
import { divide, inverse, multiply, multiply_all, negate } from './multiply';
import { power } from './power';
import { sgn } from './sgn';
import { simplify } from './simplify';
import { sine } from './sin';
import { ysinh } from './sinh';
import { subst } from './subst';
import { d_scalar_tensor, d_tensor_scalar, d_tensor_tensor } from './tensor';
// derivative

//define F p3
//define X p4
//define N p5

export function Eval_derivative(p1: U) {
  // evaluate 1st arg to get function F
  p1 = cdr(p1);
  push(car(p1));
  Eval();

  // evaluate 2nd arg and then...

  // example  result of 2nd arg  what to do
  //
  // d(f)    nil      guess X, N = nil
  // d(f,2)  2      guess X, N = 2
  // d(f,x)  x      X = x, N = nil
  // d(f,x,2)  x      X = x, N = 2
  // d(f,x,y)  x      X = x, N = y

  p1 = cdr(p1);
  push(car(p1));
  Eval();

  const p2 = pop();
  if (p2 === symbol(NIL)) {
    guess();
    push(symbol(NIL));
  } else if (isNumericAtom(p2)) {
    guess();
    push(p2);
  } else {
    push(p2);
    p1 = cdr(p1);
    push(car(p1));
    Eval();
  }

  let N = pop();
  let X = pop();
  let F = pop();

  while (true) {
    // p5 (N) might be a symbol instead of a number
    var n: number;
    if (isNumericAtom(N)) {
      push(N);
      n = pop_integer();
      if (isNaN(n)) {
        stop('nth derivative: check n');
      }
    } else {
      n = 1;
    }

    push(F);

    if (n >= 0) {
      for (let i = 0; i < n; i++) {
        push(X);
        derivative();
      }
    } else {
      n = -n;
      for (let i = 0; i < n; i++) {
        push(X);
        integral();
      }
    }

    F = pop();

    // if p5 (N) is nil then arglist is exhausted
    if (N === symbol(NIL)) {
      break;
    }

    // otherwise...

    // N    arg1    what to do
    //
    // number  nil    break
    // number  number    N = arg1, continue
    // number  symbol    X = arg1, N = arg2, continue
    //
    // symbol  nil    X = N, N = nil, continue
    // symbol  number    X = N, N = arg1, continue
    // symbol  symbol    X = N, N = arg1, continue

    if (isNumericAtom(N)) {
      p1 = cdr(p1);
      push(car(p1));
      Eval();
      N = pop();
      if (N === symbol(NIL)) {
        break; // arglist exhausted
      }
      if (isNumericAtom(N)) {
        // do nothing // N = arg1
      } else {
        X = N; // X = arg1
        p1 = cdr(p1);
        push(car(p1));
        Eval();
        N = pop(); // N = arg2
      }
    } else {
      X = N; // X = N
      p1 = cdr(p1);
      push(car(p1));
      Eval();
      N = pop(); // N = arg1
    }
  }

  push(F); // final result
}

export function derivative() {
  const p2 = pop();
  const p1 = pop();
  if (isNumericAtom(p2)) {
    stop('undefined function');
  }
  if (istensor(p1)) {
    if (istensor(p2)) {
      d_tensor_tensor(p1, p2);
    } else {
      d_tensor_scalar(p1, p2);
    }
  } else {
    if (istensor(p2)) {
      d_scalar_tensor(p1, p2);
    } else {
      d_scalar_scalar(p1, p2);
    }
  }
  return;
}

function d_scalar_scalar(p1: U, p2: U) {
  if (issymbol(p2)) {
    d_scalar_scalar_1(p1, p2);
  } else {
    // Example: d(sin(cos(x)),cos(x))
    // Replace cos(x) <- X, find derivative, then do X <- cos(x)
    push(p1); // sin(cos(x))
    push(p2); // cos(x)
    push(symbol(SECRETX)); // X
    subst(); // sin(cos(x)) -> sin(X)
    push(symbol(SECRETX)); // X
    derivative();
    push(symbol(SECRETX)); // X
    push(p2); // cos(x)
    subst(); // cos(X) -> cos(cos(x))
  }
}

function d_scalar_scalar_1(p1: U, p2: U) {
  // d(x,x)?
  if (equal(p1, p2)) {
    push(defs.one);
    return;
  }

  // d(a,x)?
  if (!iscons(p1)) {
    push(defs.zero);
    return;
  }

  if (isadd(p1)) {
    dsum(p1, p2);
    return;
  }

  if (car(p1) === symbol(MULTIPLY)) {
    dproduct(p1, p2);
    return;
  }

  if (car(p1) === symbol(POWER)) {
    dpower(p1, p2);
    return;
  }

  if (car(p1) === symbol(DERIVATIVE)) {
    dd(p1, p2);
    return;
  }

  if (car(p1) === symbol(LOG)) {
    dlog(p1, p2);
    return;
  }

  if (car(p1) === symbol(SIN)) {
    dsin(p1, p2);
    return;
  }

  if (car(p1) === symbol(COS)) {
    dcos(p1, p2);
    return;
  }

  if (car(p1) === symbol(TAN)) {
    dtan(p1, p2);
    return;
  }

  if (car(p1) === symbol(ARCSIN)) {
    darcsin(p1, p2);
    return;
  }

  if (car(p1) === symbol(ARCCOS)) {
    darccos(p1, p2);
    return;
  }

  if (car(p1) === symbol(ARCTAN)) {
    darctan(p1, p2);
    return;
  }

  if (car(p1) === symbol(SINH)) {
    dsinh(p1, p2);
    return;
  }

  if (car(p1) === symbol(COSH)) {
    dcosh(p1, p2);
    return;
  }

  if (car(p1) === symbol(TANH)) {
    dtanh(p1, p2);
    return;
  }

  if (car(p1) === symbol(ARCSINH)) {
    darcsinh(p1, p2);
    return;
  }

  if (car(p1) === symbol(ARCCOSH)) {
    darccosh(p1, p2);
    return;
  }

  if (car(p1) === symbol(ARCTANH)) {
    darctanh(p1, p2);
    return;
  }

  if (car(p1) === symbol(ABS)) {
    dabs(p1, p2);
    return;
  }

  if (car(p1) === symbol(SGN)) {
    dsgn(p1, p2);
    return;
  }

  if (car(p1) === symbol(HERMITE)) {
    dhermite(p1, p2);
    return;
  }

  if (car(p1) === symbol(ERF)) {
    derf(p1, p2);
    return;
  }

  if (car(p1) === symbol(ERFC)) {
    derfc(p1, p2);
    return;
  }

  if (car(p1) === symbol(BESSELJ)) {
    if (isZeroAtomOrTensor(caddr(p1))) {
      dbesselj0(p1, p2);
    } else {
      dbesseljn(p1, p2);
    }
    return;
  }

  if (car(p1) === symbol(BESSELY)) {
    if (isZeroAtomOrTensor(caddr(p1))) {
      dbessely0(p1, p2);
    } else {
      dbesselyn(p1, p2);
    }
    return;
  }

  if (car(p1) === symbol(INTEGRAL) && caddr(p1) === p2) {
    derivative_of_integral(p1);
    return;
  }

  dfunction(p1, p2);
}

function dsum(p1: U, p2: U) {
  p1 = cdr(p1);
  const toAdd = [];
  while (iscons(p1)) {
    push(car(p1));
    push(p2);
    derivative();
    toAdd.push(pop());
    p1 = cdr(p1);
  }
  push(add_all(toAdd));
}

function dproduct(p1: U, p2: U) {
  let p3: U;
  const n = length(p1) - 1;
  const toAdd = [];
  for (let i = 0; i < n; i++) {
    p3 = cdr(p1);
    for (let j = 0; j < n; j++) {
      push(car(p3));
      if (i === j) {
        push(p2);
        derivative();
      }
      p3 = cdr(p3);
    }
    multiply_all(n);
    toAdd.push(pop());
  }
  push(add_all(toAdd));
}

//-----------------------------------------------------------------------------
//
//       v
//  y = u
//
//  log y = v log u
//
//  1 dy   v du           dv
//  - -- = - -- + (log u) --
//  y dx   u dx           dx
//
//  dy    v  v du           dv
//  -- = u  (- -- + (log u) --)
//  dx       u dx           dx
//
//-----------------------------------------------------------------------------

function dpower(p1: U, p2: U) {
  push(caddr(p1)); // v/u
  push(cadr(p1));
  divide();

  push(cadr(p1)); // du/dx
  push(p2);
  derivative();

  multiply();

  push(cadr(p1)); // log u
  logarithm();

  push(caddr(p1)); // dv/dx
  push(p2);
  derivative();

  multiply();

  add();

  push(p1); // u^v

  multiply();
}

function dlog(p1: U, p2: U) {
  push(cadr(p1));
  push(p2);
  derivative();
  push(cadr(p1));
  divide();
}

//  derivative of derivative
//
//  example: d(d(f(x,y),y),x)
//
//  p1 = d(f(x,y),y)
//
//  p2 = x
//
//  cadr(p1) = f(x,y)
//
//  caddr(p1) = y
function dd(p1: U, p2: U) {
  // d(f(x,y),x)
  push(cadr(p1));
  push(p2);
  derivative();

  const p3 = pop();

  if (car(p3) === symbol(DERIVATIVE)) {
    // sort dx terms
    push_symbol(DERIVATIVE);
    push_symbol(DERIVATIVE);
    push(cadr(p3));

    if (lessp(caddr(p3), caddr(p1))) {
      push(caddr(p3));
      list(3);
      push(caddr(p1));
    } else {
      push(caddr(p1));
      list(3);
      push(caddr(p3));
    }

    list(3);
  } else {
    push(p3);
    push(caddr(p1));
    derivative();
  }
}

// derivative of a generic function
function dfunction(p1: U, p2: U) {
  const p3 = cdr(p1); // p3 is the argument list for the function

  if (p3 === symbol(NIL) || Find(p3, p2)) {
    push_symbol(DERIVATIVE);
    push(p1);
    push(p2);
    list(3);
  } else {
    push(defs.zero);
  }
}

function dsin(p1: U, p2: U) {
  push(cadr(p1));
  push(p2);
  derivative();
  push(cadr(p1));
  cosine();
  multiply();
}

function dcos(p1: U, p2: U) {
  push(cadr(p1));
  push(p2);
  derivative();
  push(cadr(p1));
  sine();
  multiply();
  negate();
}

function dtan(p1: U, p2: U) {
  push(cadr(p1));
  push(p2);
  derivative();
  push(cadr(p1));
  cosine();
  push_integer(-2);
  power();
  multiply();
}

function darcsin(p1: U, p2: U) {
  push(cadr(p1));
  push(p2);
  derivative();
  push_integer(1);
  push(cadr(p1));
  push_integer(2);
  power();
  subtract();
  push_rational(-1, 2);
  power();
  multiply();
}

function darccos(p1: U, p2: U) {
  push(cadr(p1));
  push(p2);
  derivative();
  push_integer(1);
  push(cadr(p1));
  push_integer(2);
  power();
  subtract();
  push_rational(-1, 2);
  power();
  multiply();
  negate();
}

//        Without simplify  With simplify
//
//  d(arctan(y/x),x)  -y/(x^2*(y^2/x^2+1))  -y/(x^2+y^2)
//
//  d(arctan(y/x),y)  1/(x*(y^2/x^2+1))  x/(x^2+y^2)
function darctan(p1: U, p2: U) {
  push(cadr(p1));
  push(p2);
  derivative();
  push_integer(1);
  push(cadr(p1));
  push_integer(2);
  power();
  add();
  inverse();
  multiply();
  simplify();
}

function dsinh(p1: U, p2: U) {
  push(cadr(p1));
  push(p2);
  derivative();
  push(cadr(p1));
  ycosh();
  multiply();
}

function dcosh(p1: U, p2: U) {
  push(cadr(p1));
  push(p2);
  derivative();
  push(cadr(p1));
  ysinh();
  multiply();
}

function dtanh(p1: U, p2: U) {
  push(cadr(p1));
  push(p2);
  derivative();
  push(cadr(p1));
  ycosh();
  push_integer(-2);
  power();
  multiply();
}

function darcsinh(p1: U, p2: U) {
  push(cadr(p1));
  push(p2);
  derivative();
  push(cadr(p1));
  push_integer(2);
  power();
  push_integer(1);
  add();
  push_rational(-1, 2);
  power();
  multiply();
}

function darccosh(p1: U, p2: U) {
  push(cadr(p1));
  push(p2);
  derivative();
  push(cadr(p1));
  push_integer(2);
  power();
  push_integer(-1);
  add();
  push_rational(-1, 2);
  power();
  multiply();
}

function darctanh(p1: U, p2: U) {
  push(cadr(p1));
  push(p2);
  derivative();
  push_integer(1);
  push(cadr(p1));
  push_integer(2);
  power();
  subtract();
  inverse();
  multiply();
}

function dabs(p1: U, p2: U) {
  push(cadr(p1));
  push(p2);
  derivative();
  push(cadr(p1));
  sgn();
  multiply();
}

function dsgn(p1: U, p2: U) {
  push(cadr(p1));
  push(p2);
  derivative();
  push(cadr(p1));
  dirac();
  multiply();
  push_integer(2);
  multiply();
}

function dhermite(p1: U, p2: U) {
  push(cadr(p1));
  push(p2);
  derivative();
  push_integer(2);
  push(caddr(p1));
  multiply();
  multiply();
  push(cadr(p1));
  push(caddr(p1));
  push_integer(-1);
  add();
  hermite();
  multiply();
}

function derf(p1: U, p2: U) {
  push(cadr(p1));
  push_integer(2);
  power();
  push_integer(-1);
  multiply();
  exponential();
  if (defs.evaluatingAsFloats) {
    push_double(Math.PI);
  } else {
    push_symbol(PI);
  }
  push_rational(-1, 2);
  power();
  multiply();
  push_integer(2);
  multiply();
  push(cadr(p1));
  push(p2);
  derivative();
  multiply();
}

function derfc(p1: U, p2: U) {
  push(cadr(p1));
  push_integer(2);
  power();
  push_integer(-1);
  multiply();
  exponential();
  if (defs.evaluatingAsFloats) {
    push_double(Math.PI);
  } else {
    push_symbol(PI);
  }
  push_rational(-1, 2);
  power();
  multiply();
  push_integer(-2);
  multiply();
  push(cadr(p1));
  push(p2);
  derivative();
  multiply();
}

function dbesselj0(p1: U, p2: U) {
  push(cadr(p1));
  push(p2);
  derivative();
  push(cadr(p1));
  push_integer(1);
  besselj();
  multiply();
  push_integer(-1);
  multiply();
}

function dbesseljn(p1: U, p2: U) {
  push(cadr(p1));
  push(p2);
  derivative();
  push(cadr(p1));
  push(caddr(p1));
  push_integer(-1);
  add();
  besselj();
  push(caddr(p1));
  push_integer(-1);
  multiply();
  push(cadr(p1));
  divide();
  push(cadr(p1));
  push(caddr(p1));
  besselj();
  multiply();
  add();
  multiply();
}

function dbessely0(p1: U, p2: U) {
  push(cadr(p1));
  push(p2);
  derivative();
  push(cadr(p1));
  push_integer(1);
  besselj();
  multiply();
  push_integer(-1);
  multiply();
}

function dbesselyn(p1: U, p2: U) {
  push(cadr(p1));
  push(p2);
  derivative();
  push(cadr(p1));
  push(caddr(p1));
  push_integer(-1);
  add();
  bessely();
  push(caddr(p1));
  push_integer(-1);
  multiply();
  push(cadr(p1));
  divide();
  push(cadr(p1));
  push(caddr(p1));
  bessely();
  multiply();
  add();
  multiply();
}

function derivative_of_integral(p1: U) {
  push(cadr(p1));
}
