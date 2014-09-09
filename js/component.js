/* Components
 */

/**
 * Returns a factory of elements with an id field name. All elements are stored
 * in a global array.
 */
var creator_with_id = function(id_field_name, global_array) {
	var id = 0;
	return function(element) {
		element[id_field_name] = id;
		global_array.push(element);
		id = id + 1;
	};
};

