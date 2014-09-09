g_Inputs = [];

var input_create = creator_with_id("input_id", g_Inputs);

var interpret_input = function(element) {
	//Interprets input as commands
	//console.log(element.command);
	if (element.command) {
		element.commands[element.command](element, element.command_parameters);
		element.command = "";
	}
};

var input_update = function () {
	_.each(g_Inputs, interpret_input);
};
