

if !inited
	inited = true
	init()


$.init = init

parse_internal = (arg) ->
	if typeof arg == 'string'
		scan(arg)
		# now its in the stack
	else if typeof arg == 'number'
		if arg % 1 == 0
			push_integer(arg)
		else
			push_double(arg)
	else if arg instanceof U
		# hey look its a U
		push(arg)
	else
		console.warn('unknown argument type', arg)
		push(symbol(NIL))

parse = (arg) ->
	parse_internal(arg)
	return pop()

exec = (name, args...) ->
	fn = get_binding(usr_symbol(name))
	check_stack()
	push(fn)

	for arg in args
		parse_internal(arg)
	
	list(1 + args.length)
	
	p1 = pop()
	push(p1)
	fixed_top_level_eval()
	result = pop()
	check_stack()
	return result


fixed_top_level_eval = ->
	save()

	trigmode = 0

	p1 = symbol(AUTOEXPAND)
	if (iszero(get_binding(p1)))
		expanding = 0
	else
		expanding = 1

	p1 = pop()
	push(p1)
	Eval()
	p2 = pop()
	
	if (p2 == symbol(NIL))
		push(p2)
		restore()
		return

	if (!iszero(get_binding(symbol(BAKE))))
		push(p2)
		bake()
		p2 = pop()

	push(p2)
	restore()


$.exec = exec
$.parse = parse

do ->
	builtin_fns = ["abs", "add", "adj", "and", "arccos", "arccosh", "arcsin", "arcsinh", "arctan", "arctanh", "arg", "atomize", "besselj", "bessely", "binding", "binomial", "ceiling", "check", "choose", "circexp", "clear", "clock", "coeff", "cofactor", "condense", "conj", "contract", "cos", "cosh", "decomp", "defint", "deg", "denominator", "det", "derivative", "dim", "dirac", "display", "divisors", "do", "dot", "draw", "dsolve", "erf", "erfc", "eigen", "eigenval", "eigenvec", "eval", "exp", "expand", "expcos", "expsin", "factor", "factorial", "factorpoly", "filter", "float", "floor", "for", "Gamma", "gcd", "hermite", "hilbert", "imag", "component", "inner", "integral", "inv", "invg", "isinteger", "isprime", "laguerre", "lcm", "leading", "legendre", "log", "mag", "mod", "multiply", "not", "nroots", "number", "numerator", "operator", "or", "outer", "polar", "power", "prime", "print", "product", "quote", "quotient", "rank", "rationalize", "real", "rect", "roots", "equals", "sgn", "simplify", "sin", "sinh", "sqrt", "stop", "subst", "sum", "tan", "tanh", "taylor", "test", "testeq", "testge", "testgt", "testle", "testlt", "transpose", "unit", "zero"]

	for fn in builtin_fns
		$[fn] = exec.bind(this, fn)