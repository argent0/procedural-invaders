/* Math */

var Vector = function(x, y) {
	return [x, y];
};

var operator_multiplication_by = function (factor) {
	return function (x) {
		return x*factor;
	};
};

var Vector_scale = function(vector, factor) {
	return _.map(vector, operator_multiplication_by(factor));
};

var Vector_add = function(vector_a, vector_b) {
	return _.map(
		_.zip(vector_a, vector_b),
		function(pair) { return pair[0] + pair[1]; });
};
