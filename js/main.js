/*jslint browser:true */
/*global with_game_canvas: true,
with_loop: true,
*/

var g_Config = {
	"screen_width": 80,
	"screen_height": 50,
	"pixel_size": 8,
   "invader_size": 5,
   "invader_simetric_width": 2,
   "interinvader_space": 2,
   //"player_cannon": 65024,
   "player_cannon": 32512,
   "player_bullet_position_offset": 2,
   "player_initial_lives": 2,
   "player_inter_shoot_turns": 10,
   "invasor_kill_score": 100,
   "initial_invader_cols": 7,
   "initial_invader_rows": 4,
   "invasion_max_shoots_per_turn": 2,
   "invasion_shoot_probability": 0.1,
};

g_Config.message_font_height = g_Config.pixel_size * 2;
g_Config.canvas_width = g_Config.screen_width * g_Config.pixel_size;
g_Config.canvas_height = g_Config.screen_height * g_Config.pixel_size;

var g_keys = {
   "left": 37,
   "right": 39,
   "space": 32,
};

var sound = function(filename) {
   var snd = new Audio(filename);
   return function () {
      snd.play();
   };
};

var with_pixelated_screen = function(body, drawing_context, clear_screen, screen_width, screen_height) {

   var _video_memory = []; 
   var _video_col = 0;

   var clear_pixelated_screen = function() {
      clear_screen();
      for(_video_col=0; _video_col < screen_width; _video_col++) {
         _video_memory[_video_col] = [];
      }
   };

   var _pixel_in_screen = function(x, y) {
      var x_in_range = (x > 0) && (x < screen_width);
      var y_in_range = (y > 0) && (y < screen_height);

      return (x_in_range && y_in_range);
   };

   var put_pixel = function(x, y) {
      if (_pixel_in_screen(x,y)) {
         drawing_context().fillStyle = "#fff";
         drawing_context().fillRect(
            x * g_Config.pixel_size,
            y * g_Config.pixel_size,
            g_Config.pixel_size,
            g_Config.pixel_size);

            _video_memory[x][y] = true;
      }
   };

   var get_pixel = function(x, y) {
      if (_pixel_in_screen(x,y)) {
         return (_video_memory[x][y]);
      }
      console.log("Error");
   };

   var write_text_at = function(text, x, y) {
      drawing_context().fillText(text,
                                 x * g_Config.pixel_size,
                                 y * g_Config.pixel_size);
   };

   body(put_pixel, clear_pixelated_screen, get_pixel, write_text_at);
};

/*

  ###..  ..... 
  ###..  ..... 
  ###..  ..... 
  ###..  ..... 
  ###..  ..... 

*/

with_simetric_invaders = function(body, put_pixel) {
   var _avoid_plain_invasors = _.memoize( function(seed) {
      var seed_str = seed.toString(2);
      //var seed_str = Math.floor(Math.random() * 100).toString(2);
      while ((seed_str.indexOf("1") === -1) || (seed_str.indexOf("0") === -1)) {
         seed_str = Math.floor(Math.random() * 100).toString(2);
      }

      return seed_str;
   });

   var draw_invader = function(seed, invader_x, invader_y) {
      
      var digit_index = 0;
      var digit = 0;
      var seed_str = _avoid_plain_invasors(seed);


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

var with_bullets = function(body, put_pixel, get_pixel) {
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

   var reset_bullets = function () {
      _bullets = [];
      _bullet_id = 0;
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
      if (bullet.x >= target.x) {
         if (bullet.x < target.x + g_Config.invader_size) {
            if (bullet.y >= target.y) {
               if (bullet.y < target.y + g_Config.invader_size) {
                  if  (get_pixel(bullet.x, bullet.y)) {
                     return true;
                  }
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

   body(update_bullets, create_bullet, create_bomb, reset_targets, register_target, reset_bullets);
};

var with_invasion = function(body, draw_invader, create_bomb, reset_targets, register_target) {

   var invasion_x = 0;
   var invasion_y = g_Config.interinvader_space + g_Config.invader_size;
   var invasion_direction = "left";
   var invader_cols = g_Config.initial_invader_cols;
   var invader_rows = g_Config.initial_invader_rows;
   var invasion_cell_size = (g_Config.invader_size + g_Config.interinvader_space);

   var _invasion_events = [];
   
   var invasion_events = function () {
      var ret = _invasion_events.slice(0);
      _invasion_events = [];
      return [ret];
   };

   var _remaining_invaders = [];

   var setup_invasion = function() {
      var col = 0;
      var row = 0;
      for(row = 0; row < invader_rows; row++) {
         _remaining_invaders[row] = [];
         for(col = 0; col < invader_cols; col++) {
            _remaining_invaders[row][col] = col;
         }
      }
      invasion_x = 0;
      invasion_y = g_Config.interinvader_space + g_Config.invader_size;
   };

   var _remove_invader = (function() {
      var explosion_sound = sound('art/sound/explosion.ogg');
      return function(row, col) {
         _remaining_invaders[row][col] = -1;
         _invasion_events.push("invasor_killed");
         explosion_sound();
      };
   }());

   var _is_invader_present = function(row, col) {
      return  _remaining_invaders[row][col] != -1;
   };

   var draw_invasion = function () {
      var x = 0;
      var invader_x, invader_y, invader_shape;
      var remove_invader_callback = function(row, col) {
         return function() {
            _remove_invader(row, col);
         };
      };
      reset_targets();
      for(row = 0; row < invader_rows; row++) {
         for(col = 0; col < invader_cols; col++) {
            if (_is_invader_present(row, col)) {
               invader_x = invasion_x + col * invasion_cell_size;
               invader_y = invasion_y + row * invasion_cell_size;
               invader_shape = (row * invader_cols) + col;
               register_target(invader_x, invader_y, remove_invader_callback(row, col));
               draw_invader(invader_shape, invader_x, invader_y);
            }
         }
      }
   };

   var _invasion_min_col = function() {
      var min_cols = [];
      for(row = 0; row < invader_rows; row++) {
         for(col = 0; col < invader_cols; col++) {
            if (_is_invader_present(row, col)) {
               min_cols.push(col);
               break; 
            }
         }
      }

      return _.min(min_cols);
   };

   var _invasion_max_col = function() {
      var max_cols = [];
      for(row = 0; row < invader_rows; row++) {
         for(col = invader_cols - 1; col >= 0; col--) {
            if (_is_invader_present(row, col)) {
               max_cols.push(col);
               break; 
            }
         }
      }

      return _.max(max_cols) + 1;
   };

   var _invasion_max_rows = function() {
      var max_rows = [];
      for(col = 0; col < invader_cols; col++) {
         for(row = invader_rows - 1; row >= 0; row--) {
            if (_is_invader_present(row, col)) {
               max_rows.push({"row": row, "col":col});
               break; 
            }
         }
      }

      return max_rows;
   };

   var _drop_bomb = function() {
      var max_rows = _invasion_max_rows();
      //var present_invaders = _.filter(_remaining_invaders[max_row], function(col) { return (col > 0); });
      if (max_rows.length > 0) {
         var firing_invader = _.sample(max_rows);
         create_bomb(invasion_x +
                     firing_invader.col * invasion_cell_size +
                     g_Config.invader_simetric_width + 1,
         invasion_y + g_Config.invader_size + firing_invader.row * invasion_cell_size);
      }
   };

   var update_invasion = function() {

      if (invasion_direction === "left") {
         if (invasion_x > 0 - _invasion_min_col() * invasion_cell_size) {
         invasion_x -= 1;
         } else {
            invasion_direction = "right";
            invasion_y++;
         }
      } else { // invasion is moving right
         if (invasion_x < (g_Config.screen_width - _invasion_max_col() * invasion_cell_size)) {
            invasion_x += 1;
         } else {
            invasion_direction = "left";
            invasion_y++;
         }
      }

      var i = 0;
      var droped_bombs = 0;
      var dice = 0;
      for (i=0; i<g_Config.initial_invader_cols; i++) {
        
         dice = Math.random(); 
         if (dice < g_Config.invasion_shoot_probability) {
            droped_bombs++;
            _drop_bomb();
         }

         if (droped_bombs >= g_Config.invasion_max_shoots_per_turn) {
            break;
         }
      }
   };

   body(setup_invasion, draw_invasion, update_invasion, invasion_events);
};

/*
  .....  000.. 
  .....  000.. 
  ..#..  001.. 
  #####  111.. 
  #####  111.. 111,111,100,000,000
*/

var with_player_cannon = function (body, draw_invader, create_bullet, register_target) {

   var player_x = Math.floor(g_Config.screen_width / 2);
   var player_y = g_Config.screen_height - g_Config.interinvader_space - g_Config.invader_size;
   var _player_lives = g_Config.player_initial_lives;
   var _player_events = [];

   var reset_player_position = function() {
      player_x = Math.floor(g_Config.screen_width / 2);
      player_y = g_Config.screen_height - g_Config.interinvader_space - g_Config.invader_size;
   };

   var reset_player_lives = function() {
      _player_lives = g_Config.player_initial_lives;
   };

   var player_events = function () {
      var ret = _player_events.slice(0);
      _player_events = [];
      return [ret];
   };

   var _decrease_player_lives = (function() {
      var explosion_sound = sound('art/sound/player-explosion.ogg');
      return function () {
         _player_lives--;
         explosion_sound();
         if (_player_lives < 0) {
            _player_events.push("player_loses_all_lives");
         } else {
            _player_events.push("player_loses_one_life");
         }
      };
   }());

   var remaining_player_lives = function() {
      return _player_lives;
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

   var _turns_to_next_fire = 0;

   var draw_player_cannon = function() {
      draw_invader(g_Config.player_cannon, player_x, player_y);
      register_target(player_x, player_y, _decrease_player_lives);

      if (_turns_to_next_fire > 0) {
         _turns_to_next_fire--;
      }
   };

   var fire = (function() {
      var phaser_sound = sound("art/sound/phaser.wav");
      return function() {
         if (_turns_to_next_fire === 0) {
            phaser_sound();
            create_bullet(player_x + g_Config.player_bullet_position_offset , player_y + 2);
            _turns_to_next_fire = g_Config.player_inter_shoot_turns;
         }
      };
   }());

   var player_action = {
      "fire": fire,
      "move_left": move_left,
      "move_right": move_right,
   };

   body(draw_player_cannon, player_action, remaining_player_lives, reset_player_position, reset_player_lives, player_events);
};

var with_ui = function(body, draw_invader, remaining_player_lives, write_text_at) {

   var _score = 0;

   var reset_score = function () {
      _score = 0;
   };

   var draw_ui = function() {
      var i = 0;
      for(i = 0; i < remaining_player_lives(); i++) {
         draw_invader(g_Config.player_cannon,
                      g_Config.interinvader_space + i * (g_Config.invader_size + g_Config.interinvader_space),
                      0);
      }

      write_text_at(_score, g_Config.screen_width /2, 3);
   };

   var increase_score = function (amount) {
      _score += amount;
   };

   body(draw_ui, increase_score, reset_score);
};

with_game_canvas( function(clear_screen, drawing_context) {
with_pixelated_screen(function(put_pixel, clear_pixelated_screen, get_pixel, write_text_at) {
with_simetric_invaders(function(draw_invader) {
with_bullets(function(update_bullets, create_bullet, create_bomb, reset_targets, register_target, reset_bullets) {
with_invasion(function(setup_invasion, draw_invasion, update_invasion, invasion_events) {
with_player_cannon(function(draw_player_cannon, player_action, remaining_player_lives, reset_player_position, reset_player_lives, player_events) {
with_ui(function(draw_ui, increase_score, reset_score) {
with_key_bindings(function(bind_key) {
with_loop(100, function(interruptions, start_loop, pause_loop) {
      clear_pixelated_screen();
      draw_invasion();        // must be before player_cannon
      draw_player_cannon();
      update_invasion();
      update_bullets();
      draw_ui();

      _.each(player_events(), function(player_event) {
         if (interruptions[player_event]) {
            interruptions[player_event](start_loop, pause_loop);
         }
      });

      _.each(invasion_events(), function(invasion_event) {
         if (interruptions[invasion_event]) {
            interruptions[invasion_event](start_loop, pause_loop);
         }
      });
      
   },
   function() { //before the loop
      setup_invasion();
      clear_screen();
      bind_key(g_keys.left, player_action.move_left);
      bind_key(g_keys.right, player_action.move_right);
      bind_key(g_keys.space, player_action.fire); 
   },{
      "player_loses_one_life": function(start_loop, pause_loop) {
         reset_bullets();
         reset_player_position();
      },
      "player_loses_all_lives": function(start_loop, pause_loop) {
         pause_loop();
         clear_screen();
         write_text_at("Game Over", g_Config.screen_width / 4, g_Config.screen_height / 2);
         setup_invasion();
         reset_player_position();
         reset_player_lives();
      },
      "invasor_killed": function(start_loop, pause_loop) {
         increase_score(g_Config.invasor_kill_score);
      },
}); //with_loop
}); //with_key_bindings
}, draw_invader, remaining_player_lives, write_text_at); //with_ui
}, draw_invader, create_bullet, register_target); //with_player_cannon
}, draw_invader, create_bomb, reset_targets, register_target); //with_invasion
}, put_pixel, get_pixel); //with_bullets
}, put_pixel);}, drawing_context, clear_screen, g_Config.screen_width, g_Config.screen_height); //with_pixelated_screen
});


/* Ein Klein Todo
 * The Invasion
 * The Invasion fires
 * The player can shoot the invasion
 * The defenses
 */



// vim: expandtab
