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
   "interinvader_space": 2,
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

var with_pixelated_screen = function(body, drawing_context, clear_screen) {

   var _video_memory = []; 
   var _video_col = 0;

   var clear_pixelated_screen = function() {
      clear_screen();
      for(_video_col=0; _video_col < g_Config.screen_width; _video_col++) {
         _video_memory[_video_col] = [];
      }
   };

   var put_pixel = function(x, y) {
      drawing_context().fillStyle = "#fff";
      drawing_context().fillRect(
         x * g_Config.pixel_size,
         y * g_Config.pixel_size,
         g_Config.pixel_size,
         g_Config.pixel_size);

      _video_memory[x][y] = 1;
   };

   var get_pixel = function(x, y) {
      return (_video_memory[x][y] === undefined);
   };

   body(put_pixel, clear_pixelated_screen);
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
            var x = digit_index % (g_Config.invader_size - g_Config.invader_simetric_width);
            var y = Math.floor(digit_index / (g_Config.invader_size -g_Config.invader_simetric_width));
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

   var Bullet = function(x, y, velocity) {
      this.x = x;
      this.y = y;
      this.id = _bullet_id;
      this.velocity = velocity;

      _bullet_id +=  1;
   };

   var create_bullet = function(x, y) {
      /* Bullets travel up screen.*/
      var bullet = new Bullet(x, y, -1);
      _bullets[bullet.id.toString()] = bullet;
   };

   var create_bomb = function(x, y) {
      /* Bombs travel down screen.*/
      var bomb = new Bullet(x, y, 1);
      _bullets[bomb.id.toString()] = bomb;
   };

   var _target_id = 0;
   var _targets = {};

   var reset_targets = function() {
      _targets = {};
      _target_id = 0;
   };

   var register_target = function(x, y, callback) {
      /* Tell the bullet engine that there is an invader at x, y */
      var target_key = _target_id.toString();
      _targets[target_key] = { "x": x, "y": y, "callback": callback, "id": target_key };
      _target_id++;
   };

   var _has_collided = function (bullet, target) {
      if (bullet.x > target.x) {
         if (bullet.x < target.x + g_Config.invader_size) {
            if (bullet.y > target.y) {
               if (bullet.y < target.y + g_Config.invader_size) {
                  return true;
               }
            }
         }
      }
      return false;
   };

   var update_bullets = function () {
      _.each(_bullets, function(bullet) {
         if ((bullet.y < 0) || (bullet.y > g_Config.screen_height)) {
            delete _bullet_id[bullet.id.toString()];
         } else {
            bullet.y += bullet.velocity;
            if (!(_.any(_targets, function(target) {
                  if (_has_collided(bullet, target)) {
                     console.log("Collision");
                     target.callback();
                     delete _targets[target.id];
                     delete _bullets[bullet.id];
                     return true;
                  }
                  return false;
               }))) {
                  put_pixel(bullet.x, bullet.y);
            }
         }
      });
   };

   body(update_bullets, create_bullet, create_bomb, reset_targets, register_target);
};

var with_invasion = function(body, draw_invader, create_bomb, reset_targets, register_target) {

   var invasion_x = 0;
   var invasion_y = 10;
   var invasion_direction = "left";
   var invader_cols = 15;
   var invader_rows = 5;

   var _remaining_invaders = [];
   var col = 0;
   var row = 0;

   var setup_invation = function() {
      for(row = 0; row < invader_rows; row++) {
         _remaining_invaders[row] = [];
         for(col = 0; col < invader_cols; col++) {
            _remaining_invaders[row][col] = col;
         }
      }
   };

   var _remove_invader = function(row, col) {
      _remaining_invaders[row][col] = -1;
   };

   var _is_invader_present = function(row, col) {
      return  _remaining_invaders[row][col] != -1;
   };

   var draw_invasion = function () {
      var x = 0;
      var invader_x, invader_y, invader_shape;
      var remove_invader_callback = function(row, col) {
         return function() {
            console.log("Removing invader.");
            _remove_invader(row, col);
         };
      };
      reset_targets();
      for(row = 0; row < invader_rows; row++) {
         for(col = 0; col < invader_cols; col++) {
            if (_is_invader_present(row, col)) {
               invader_x = invasion_x + col * (g_Config.invader_size + g_Config.interinvader_space);
               invader_y = invasion_y + row * (g_Config.invader_size +g_Config.interinvader_space);
               invader_shape = (row * invader_cols) + col;
               register_target(invader_x, invader_y, remove_invader_callback(row, col));
               draw_invader(invader_shape, invader_x, invader_y);
            }
         }
      }
   };

   var _drop_bomb = function() {
      var max_row = _remaining_invaders.length - 1;
      var present_invaders = _.filter(_remaining_invaders[max_row], function(col) { return (col > 0); });
      var firing_invader = _.sample(present_invaders);
      create_bomb(invasion_x +
                     firing_invader * (g_Config.invader_size + g_Config.interinvader_space) +
                     g_Config.invader_simetric_width + 1,
                  invasion_y + g_Config.invader_size + max_row * (g_Config.invader_size + g_Config.interinvader_space));
   };

   var update_invasion = function() {
      if (invasion_direction === "left") {
         if (invasion_x > 0) {
         invasion_x -= 1;
         } else {
            invasion_direction = "right";
            invasion_y++;
            _drop_bomb();
            _drop_bomb();
         }
      } else {
         if (invasion_x < (g_Config.screen_width - invader_cols * (g_Config.invader_size + 2))) {
            invasion_x += 1;
         } else {
            invasion_direction = "left";
            invasion_y++;
            _drop_bomb();
            _drop_bomb();
         }
      }
   };

   setup_invation();
   body(draw_invasion, update_invasion);
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
with_pixelated_screen(function(put_pixel, clear_pixelated_screen) {
with_simetric_invaders(function(draw_invader) {
with_bullets(function(update_bullets, create_bullet, create_bomb, reset_targets, register_target) {
with_invasion(function(draw_invasion, update_invasion) {
with_player_cannon(function(draw_player_cannon, player_action) {
with_key_bindings(function(bind_key) {
with_loop(100, function() {
      clear_pixelated_screen();
      draw_player_cannon();
      draw_invasion();
      update_invasion();
      update_bullets();
   },
   function() {
      clear_screen();
      bind_key(g_keys.left, player_action.move_left);
      bind_key(g_keys.right, player_action.move_right);
      bind_key(g_keys.space, player_action.fire); 

}); //with_loop
}); //with_key_bindings
}, draw_invader, create_bullet); //with_player_cannon
}, draw_invader, create_bomb, reset_targets, register_target); //with_invasion
}, put_pixel); //with_bullets
}, put_pixel);}, drawing_context, clear_screen); //with_pixelated_screen
});

var sound = function(filename) {
   var snd = new Audio(filename);
   return function () {
      snd.play();
   };
};

/* Ein Klein Todo
 * The Invasion
 * The Invasion fires
 * The player can shoot the invasion
 * The defenses
 */



// vim: expandtab
