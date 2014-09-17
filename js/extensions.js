/* Memoize a function with no arguments */
var Lazy_value = function(fc_function) {
	var evaluated = false,
	return_value;

	return function() {
		if (!evaluated) {
			return_value = fc_function();
			evaluated = true;
		}
		return return_value;
	};
};

/* A typedef like function */
var Alias = function(fc_function) {
	return function() {
		return fc_function.apply(null, arguments);
	};
};
