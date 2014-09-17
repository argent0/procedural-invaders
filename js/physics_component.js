/*global
_:true,
Vector_add: true
 */

var _key_separator_character = ",";
var _position_key = function(position) {
	return position[0]+_key_separator_character+position[1];
};

var g_Physics_by_id = {};
var g_Physics_by_position = {};

var physics_create = (function() {
	var id = 0;
	return function(element) {
      console.assert(element.position, "Physic element with no position.");
		element.physics_id = id;
		g_Physics_by_id[id] = element;
		g_Physics_by_position[_position_key(element.position)] = element;
		id = id + 1;
	};
}());

var physics_displace = function(element, delta_time) {
	//element.displacement = Vector_scale( element.velocity, delta_time);
	element.virtual_position = Vector_add(
		element.displacement, element.position);
};

var physics_move = function(element) {
	//var new_position = Vector_add(
	//	element.displacement, element.position);
	var current_key = _position_key(element.position);
	var destination_key = _position_key(element.virtual_position);

	if (!g_Physics_by_position[destination_key]) {
		element.position = element.virtual_position;
		delete g_Physics_by_position[current_key];
		g_Physics_by_position[destination_key] = element;
	}

	delete element.displacement;
	delete element.virtual_position;
};

var physics_apply_constrains = function(element) {
	_.each(element.constrains, function(constrain) { constrain(element); });
};

var with_physiscs_by_id = function (callback) {
	_.each(
      _.map(Object.keys(g_Physics_by_id), function(id) {return g_Physics_by_id[id]; }),
      callback);
};

var physics_update = function() {
   with_physiscs_by_id( function(element) {
      if (element.displacement) {
             physics_displace(element, null);
      }
   });

   with_physiscs_by_id( function(element) {
      if (element.virtual_position) {
      physics_apply_constrains(element);
      }
   });
	
   with_physiscs_by_id( function(element) {
      if (element.displacement) {
               physics_move(element);
      }
   });
};

// vim: expandtab

