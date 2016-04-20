test_test = ->
	run_test [
		"a<a+1",
		"1",

		"a-1<a",
		"1",

		"1==1",
		"1",

		"1==2",
		"0",

		"1>=1",
		"1",

		"1>=2",
		"0",

		"2>=1",
		"1",

		"1>1",
		"0",

		"1>2",
		"0",

		"2>1",
		"1",

		"1<=1",
		"1",

		"1<=2",
		"1",

		"2<=1",
		"0",

		"1<1",
		"0",

		"1<2",
		"1",

		"2<1",
		"0",

		"test(0,A,B)",
		"B",

		"test(1,A,B)",
		"A",

		"test(0,A,0,B)",
		"0",

		"test(0,A,0,B,C)",
		"C",

		"not(1)",
		"0",

		"not(0)",
		"1",

		"not(a=a)",
		"0",

		"and(1,1)",
		"1",

		"and(1,0)",
		"0",

		"or(1,0)",
		"1",

		"or(0,0)",
		"0",

		"(0,0)==0",
		"1",

		"1<sqrt(3)",
		"1",
	]

