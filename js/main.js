/*jslint browser:true */
/*global with_game_canvas: true,
with_loop: true,
*/

var g_Config = {
	"screen_width": 160,
	"screen_height": 100,
	"pixel_size": 4,
   "invader_size": 5,
   "invader_simetric_width": 2,
   //"player_cannon": 65024,
   "player_cannon": 32512,
   "player_bullet_position_offset": 2,
};

var g_keys = {
   "left": 37,
   "right": 39,
   "space": 32,
};

g_Config.canvas_width = g_Config.screen_width * g_Config.pixel_size;
g_Config.canvas_height = g_Config.screen_height * g_Config.pixel_size;

var with_pixelated_screen = function(body, drawing_context) {
   var put_pixel = function(x, y) {
      drawing_context().fillStyle = "#fff";
      drawing_context().fillRect(
         x * g_Config.pixel_size,
         y * g_Config.pixel_size,
         g_Config.pixel_size,
         g_Config.pixel_size);
   };

   body(put_pixel);
};

/*

  ###..  ..... 
  ###..  ..... 
  ###..  ..... 
  ###..  ..... 
  ###..  ..... 

*/

with_simetric_invaders = function(body, put_pixel) {
   var draw_invader = function(seed, invader_x, invader_y) {
      
      var digit_index = 0;
      var digit = 0;
      var seed_str = seed.toString(2);

      var n_invader_pixels = g_Config.invader_size - g_Config.invader_simetric_width;
      n_invader_pixels *= g_Config.invader_size;

      for(digit_index = 0; digit_index < n_invader_pixels; digit_index++) {
         digit =  seed_str[seed_str.length - 1 - (digit_index % seed_str.length)];
         
         if (digit === "1") {
            var x = digit_index % (g_Config.invader_size - 2);
            var y = Math.floor(digit_index / (g_Config.invader_size - 2));
            var reflected_x = g_Config.invader_size - x - 1;
            put_pixel(invader_x + x, invader_y + y);
            put_pixel(invader_x + reflected_x, invader_y + y);
         }
      }
   };

   body(draw_invader);
};

var with_key_bindings = function(body) {
   var bindings = {};

   var bind_key = function(key_code, callback) {
      bindings[key_code.toString()] = callback;
   };

   $(document.body).unbind("keydown"); // Just in case
   $(document.body).keydown( function(event) {
      var key_code = event.keyCode.toString();
      if (bindings[key_code]) {
         bindings[key_code]();
      }
   });

   body(bind_key);
};

var with_bullets = function(body, put_pixel) {
   var _bullets = {};
   var _bullet_id = 0;

   var Bullet = function(x, y) {
      this.x = x;
      this.y = y;
      this.id = _bullet_id;

      _bullet_id +=  1;

      console.log("New bullet");
   };

   var create_bullet = function(x, y) {
      var bullet = new Bullet(x, y);
      _bullets[bullet.id.toString()] = bullet;
   };

   var update_bullets = function () {
      _.each(_bullets, function(bullet) {
         if (bullet.y < 0) {
            delete _bullet_id[bullet.id.toString()];
         } else {
            bullet.y -= 1;

            put_pixel(bullet.x, bullet.y);
         }
      });
   };

   body(update_bullets, create_bullet);
};

/*
  .....  000.. 
  .....  000.. 
  ..#..  001.. 
  #####  111.. 
  #####  111.. 111,111,100,000,000
*/

var with_player_cannon = function (body, draw_invader, create_bullet) {

   var player_x = 80;
   var player_y = 90;

   var draw_player_cannon = function() {
      draw_invader(g_Config.player_cannon, player_x, player_y);
   };

   var move_left = function() {
      if (player_x > 0) {
         player_x -= 1;
      }
   };

   var move_right = function() {
      if (player_x < g_Config.screen_width - g_Config.invader_size) {
         player_x += 1;
      }
   };

   var fire = function() {
      create_bullet(player_x + g_Config.player_bullet_position_offset , player_y);
   };

   var player_action = {
      "fire": fire,
      "move_left": move_left,
      "move_right": move_right,
   };

   body(draw_player_cannon, player_action);
};


with_game_canvas( function(clear_screen, drawing_context) {
with_pixelated_screen(function(put_pixel) {
with_simetric_invaders(function(draw_invader) {
with_bullets(function(update_bullets, create_bullet) {
with_player_cannon(function(draw_player_cannon, player_action) {
with_key_bindings(function(bind_key) {
with_loop(100, function() {
      console.log("Loop body");
      clear_screen();
      draw_player_cannon();
      update_bullets();
   },
   function() {
      console.log("Comencing Loop");
      clear_screen();
      //var x = 0;
      //var invader_cols = 20;
      //var invader_rows = 10;
      //for(x = 0; x < invader_cols * invader_rows; x++) {
      //  draw_invader(x, 
      //               (x % invader_cols) * (g_Config.invader_size + 2),
      //               Math.floor(x / invader_cols) * (g_Config.invader_size + 2));
      //}
      bind_key(g_keys.left, player_action.move_left);
      bind_key(g_keys.right, player_action.move_right);
      bind_key(g_keys.space, player_action.fire); 

}); //with_loop
}); //with_key_bindings
}, draw_invader, create_bullet); //with_player_cannon
}, put_pixel); //with_bullets
}, put_pixel);}, drawing_context); });

var sound = function(filename) {
   var snd = new Audio(filename);
   return function () {
      snd.play();
   };
};

// vim: expandtab
