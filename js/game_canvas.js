var with_game_canvas = function(body) {

   var game_div = Lazy_value(function() {
      var game_div = document.getElementById("game");
      if (!game_div) {
         throw "Couldn't find game div.";
      }
      return game_div;
   });

   var canvas = Lazy_value(function() {
      var canvas = document.createElement("canvas");
      canvas.width = g_Config.canvas_width;
      canvas.height = g_Config.canvas_height;
      game_div().appendChild(canvas);
      return canvas;
   });

   var drawing_context = Lazy_value(function() {
      var context = canvas().getContext('2d');
      if (!context) {
         throw "Couldn't find context.";
      }
      context.font = g_Config.message_font_height + 'px game-font';//40px Arial';
      return context;
   });

   var clear_screen = function () {
      drawing_context().clearRect(0, 0, g_Config.canvas_width, g_Config.canvas_height);
   };

   body(clear_screen, drawing_context);

};
// vim: expandtab
