/*jslint browser:true */
/*global with_game_canvas: true,
with_loop: true,
*/

var g_Config = {
   "enable_color": true,
   "mono_color": "#fff",
	"screen_width": 80,
	"screen_height": 50,
	"pixel_size": 8,
   "invader_size": 5,
   "invader_simetric_width": 2,
   "interinvader_space": 2,
   "player_cannon": 32512,
   "player_bullet_position_offset": 2,
   "player_initial_lives": 0,
   "player_lives_reduction": 1,
   "player_inter_shoot_turns": 10,
   "invasor_kill_score": 100,
   "invasor_kills_for_life_extensions": 2,
   "initial_invader_cols": 7,
   "initial_invader_rows": 4,
   "invasion_max_shoots_per_turn": 2,
   "invasion_shoot_probability": 0.1,
   "invasion_inter_movement_turns": 1,
   "eplosion_density": 0.5,
   "explosion_life_turns": 2,
   "bullet_color": "#ffff00",
   "explosion_color": "#ff0000",
};

g_Config.message_font_height = g_Config.pixel_size * 2;
g_Config.canvas_width = g_Config.screen_width * g_Config.pixel_size;
g_Config.canvas_height = g_Config.screen_height * g_Config.pixel_size;

var g_keys = {
   "left": 37,
   "right": 39,
   "space": 32,
   "letter_r": 82,
   "letter_f": 70,
};

var supports_html5_storage = function () {
   try {
      return 'localStorage' in window && window.localStorage !== null;
   } catch (e) {
      return false;
   }
};

g_Config.has_local_storage = supports_html5_storage();

var sound = function(filename) {
   var snd = new Audio(filename);
   return function () {
      snd.play();
   };
};

var with_pixelated_screen = function(body, canvas, drawing_context, clear_screen, screen_width, screen_height) {

   var _Pixelated_Screen = function() {

      var self = this;
      var _video_memory = []; 
      var _video_col = 0;

      canvas().width = window.innerWidth;
      canvas().height = window.innerHeight;

      var _pixel_width = Math.floor(canvas().width / screen_width);
      var _pixel_height = Math.floor(canvas().height / screen_height);

      drawing_context().font = _pixel_height * 1.5 + 'px game-font';

      for(_video_col=0; _video_col < screen_width; _video_col++) {
         _video_memory[_video_col] = [];
      }

      var _pixel_in_screen = function(x, y) {
         var x_in_range = (x >= 0) && (x < screen_width);
         var y_in_range = (y >= 0) && (y < screen_height);

         return (x_in_range && y_in_range);
      };

      self.clear = function() {
         clear_screen();
         for(_video_col=0; _video_col < screen_width; _video_col++) {
            _video_memory[_video_col] = [];
         }
         _text_lines = {};
         _text_line_id = 0;
      };

      self.put_pixel = (function () {
         if (g_Config.enable_color) {
            return function(x, y, color) {
               if (_pixel_in_screen(x,y)) {
                  drawing_context().fillStyle = color;
                  drawing_context().fillRect(
                     x * _pixel_width,
                     y * _pixel_height,
                     _pixel_width,
                     _pixel_height);

                     _video_memory[x][y] = color;
               }
            };
         } else {
            return function(x, y) {
               var color = "#fff";
               if (_pixel_in_screen(x,y)) {
                  drawing_context().fillStyle = color;
                  drawing_context().fillRect(
                     x * _pixel_width,
                     y * _pixel_height,
                     _pixel_width,
                     _pixel_height);

                     _video_memory[x][y] = color;
               }
            };
         }
      }());

      self.get_pixel = function(x, y) {
         if (_pixel_in_screen(x,y)) {
            return (_video_memory[x][y]);
         }
         console.log("Error");
      };

      var _text_lines = {};
      var _text_line_id = 0;

      var _Text_line = function(text, col, row) {
         this.text = text;
         this.row = row;
         this.col = col;
         this.id = _text_line_id;
         _text_line_id += 1;

         this.draw = function() {
            drawing_context().fillStyle = "#fff";
            drawing_context().fillText(text,
                                       col * _pixel_width,
                                       row * _pixel_height);
         };
      };

      self.write_text_at = function(text, x, y) {
         var text_line = new _Text_line(text, x, y);
         _text_lines[text_line.id.toString()] = text_line;
         text_line.draw();
      };

      self.go_full_screen = function () {
         if(canvas().requestFullScreen) {
            canvas().requestFullScreen();
         }
         else if(canvas().webkitRequestFullScreen) {
            canvas().webkitRequestFullScreen();
         }
         else if(canvas().mozRequestFullScreen) {
            canvas().mozRequestFullScreen();
         }
      };

      self.redraw = function() {
         console.log("Redraw");
         canvas().width = window.innerWidth;
         canvas().height = window.innerHeight;
         _pixel_width = Math.floor(canvas().width / screen_width);
         _pixel_height = Math.floor(canvas().height / screen_height);
         drawing_context().font = _pixel_height * 1 + 'px game-font';//40px Arial';

         _.each(_text_lines, function(text_line) {
            text_line.draw();
         });

         _.each(_video_memory, function(pixel_row, x) {
            _.each(pixel_row, function(color, y) {
               drawing_context().fillStyle = color;
                  drawing_context().fillRect(
                     x * _pixel_width,
                     y * _pixel_height,
                     _pixel_width,
                     _pixel_height);
            });
         });
      };


      self.width = function() {
         return screen_width;
      };

      self.height = function() {
         return screen_height;
      };

   };

   pixelated_screen = new _Pixelated_Screen();

   window.addEventListener('resize', pixelated_screen.redraw, false);
   window.go_full_screen = pixelated_screen.go_full_screen;

   body(pixelated_screen);
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

   var _invader_color = _.memoize( function(seed) {
      var color_parts = _.sample(["f0","f0","f0", "00", "00", "00"], 3);
      var final_color_string = "#" + color_parts.join("");
      while ((final_color_string.indexOf("f") === -1) || (final_color_string.indexOf("0") === -1)) {
         color_parts = _.sample(["f0","f0","f0", "00", "00", "00"], 3);
         final_color_string = "#" + color_parts.join("");
      }
      return final_color_string;
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
            var invader_color;
            if (g_Config.enable_color) {
               invader_color = _invader_color(seed);
            } else {
               invader_color = g_Config.mono_color;
            }
            put_pixel(invader_x + x, invader_y + y, invader_color);
            put_pixel(invader_x + reflected_x, invader_y + y, invader_color);
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
   var _explosions = {};
   var _explosion_id = 0;

   var _Explosion = function(explosion_x, explosion_y) {

      var self = this;

      self.id = _explosion_id;
      _explosion_id += 1;

      self.age = 0;

      self.draw = function() {
         self.age += 1;
         var pixel_x;
         var pixel_y;


         for(pixel_x = explosion_x + 1;
             pixel_x < explosion_x + 1 + g_Config.invader_size - 1;
             pixel_x++) {
               for(pixel_y = explosion_y + 1;
                   pixel_y < explosion_y + 1 + g_Config.invader_size - 1;
                  pixel_y++) {
                  var dice = Math.random();
                  if (dice > g_Config.eplosion_density) {
                     put_pixel(pixel_x, pixel_y, g_Config.explosion_color);
                  }
               }
         }
      };
   };

   var _create_explosion = function(x, y) {
      var explosion = new _Explosion(x, y);
      _explosions[_explosion_id.toString()] = explosion;
   };
   
   var reset_explosions = function() {
      _explosions = {};
      _explosion_id = 0;
   };

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
                     _create_explosion(target.x, target.y);
                     target.callback();
                     delete _targets[target.id];
                     delete _bullets[bullet.id];
                     return true;
                  }
                  return false;
               }))) {
                  put_pixel(bullet.x, bullet.y, g_Config.bullet_color);
            }
         }
      });

      _.each(_explosions, function(explosion) {
         if (explosion.age > g_Config.explosion_life_turns) {
            delete _explosions[explosion.id.toString()];
         } else {
            explosion.draw();
         }
      });
   };

   body(update_bullets, create_bullet, create_bomb, reset_targets, register_target, reset_bullets, reset_explosions);
};

var with_invasion = function(body, draw_invader, create_bomb, reset_targets, register_target) {

   var invasion_x = 0;
   var invasion_y = g_Config.interinvader_space + g_Config.invader_size;
   var invasion_direction = "left";
   var invader_cols = g_Config.initial_invader_cols;
   var invader_rows = g_Config.initial_invader_rows;
   var _number_of_invaders_remaining = invader_rows * invader_cols;
   var invasion_cell_size = (g_Config.invader_size + g_Config.interinvader_space);
   var _invasor_shape_offeset = 0;

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
      invasion_direction = "left";
      _number_of_invaders_remaining = invader_rows * invader_cols;
      _invasor_shape_offeset += _number_of_invaders_remaining;
   };

   var _remove_invader = (function() {
      var explosion_sound = sound('art/sound/explosion.wav');
      return function(row, col) {
         _remaining_invaders[row][col] = -1;
         _invasion_events.push("invasor_killed");
         explosion_sound();
         _number_of_invaders_remaining -= 1;
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
               if ((invader_y + g_Config.invader_size) > g_Config.screen_height - g_Config.interinvader_space - 3) {
                  _invasion_events.push("game_over");
                  break;
               }
               invader_shape = _invasor_shape_offeset + (row * invader_cols) + col;
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

   var _move_invasion = function() {
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
   };

   var _turns_to_next_movement = 0;
   var update_invasion = function() {

      if (_turns_to_next_movement === 0) {
         _move_invasion();
         _turns_to_next_movement = g_Config.invasion_inter_movement_turns;
      } else {
         _turns_to_next_movement--;
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

      if (_number_of_invaders_remaining === 0) {
         _invasion_events.push("invasion_wave_cleared");
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
      var explosion_sound = sound('art/sound/player-explosion.wav');
      return function () {
         _player_lives -= g_Config.player_lives_reduction;
         explosion_sound();
         if (_player_lives < 0) {
            _player_events.push("game_over");
         } else {
            _player_events.push("player_loses_one_life");
         }
      };
   }());

   var increase_player_lives = (function() {
      var life_extended_sound = sound('art/sound/life-extension.wav');
      return function () {
         _player_lives += g_Config.player_lives_reduction;
         life_extended_sound();
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

   body(draw_player_cannon, player_action, remaining_player_lives, reset_player_position, reset_player_lives, player_events,
       increase_player_lives);
};

var with_ui = function(body, pixelated_screen, draw_invader, remaining_player_lives, increase_player_lives, player_action) {

   var _score = 0;
   var _wave = 1;
   var _life_extensions = 1;

   var reset_score = function () {
      _score = 0;
      _wave = 0;
   };

   var draw_on_screen_controls = function() {
      $("#controls").css("visibility", "visible");
      $("#left").on("click", player_action.move_left);
      $("#right").on("click", player_action.move_right);
      $("#fire").on("click", player_action.fire);
   };

   var draw_ui = function() {

      var i = 0;
      for(i = 0; i < remaining_player_lives(); i++) {
         draw_invader(g_Config.player_cannon,
                      g_Config.interinvader_space + i * (g_Config.invader_size + g_Config.interinvader_space),
                      0);
      }

      pixelated_screen.write_text_at("Score", g_Config.screen_width /2, 3);
      pixelated_screen.write_text_at(_score, g_Config.screen_width /2, 3 +
                    g_Config.message_font_height / g_Config.pixel_size);

      pixelated_screen.write_text_at("Wave", g_Config.screen_width /4*3, 3);
      pixelated_screen.write_text_at(_wave, g_Config.screen_width /4*3, 3 +
                    g_Config.message_font_height / g_Config.pixel_size);

      //write_text_at(_score, g_Config.screen_width /2, 3);
   };

   var increase_score = function (amount) {
      _score += amount;
      var extension_boundary = Math.pow(g_Config.invasor_kills_for_life_extensions, _life_extensions) * g_Config.invasor_kill_score;
      console.log(extension_boundary);
      if ((_score > extension_boundary - 1) && (_score < extension_boundary + 1)) {
         if (remaining_player_lives() < g_Config.player_initial_lives) {
            increase_player_lives();
         }
         _life_extensions += 1;
      }
   };

   var increase_wave = function () {
      _wave += 1;
   };

   var draw_game_restart_screen = function (restart_message) {
      pixelated_screen.clear();
      pixelated_screen.write_text_at(restart_message, g_Config.screen_width / 4, g_Config.screen_height / 2);
      pixelated_screen.write_text_at("Final Score: " + _score, g_Config.screen_width / 4, g_Config.screen_height / 2 +
                    g_Config.message_font_height / g_Config.pixel_size);
      pixelated_screen.write_text_at("Final Wave: " + _wave, g_Config.screen_width / 4, g_Config.screen_height / 2 +
                    2 * g_Config.message_font_height / g_Config.pixel_size);
      if (g_Config.has_local_storage) {
         var max_score = window.localStorage.getItem("max_score");
         if ( max_score !== null ) {
            if (_score > max_score) {
               window.localStorage.setItem("max_score", _score);
            }
         } else {
            window.localStorage.setItem("max_score", _score);
         }
      }
   };

   var draw_splash_screen = function() {
      pixelated_screen.clear();
      var lines = [
         "***......................................................",
         ".*....................................*..................",
         ".*.......................................................",
         ".*...*.***...*...*...****....****....**.....****...*.***.",
         ".*...**...*..*...*.......*..*....*....*....*....*..**...*",
         ".*...*....*..*...*...*****...**.......*....*....*..*....*",
         ".*...*....*...*.*...*....*.....**.....*....*....*..*....*",
         ".*...*....*...*.*...*...**..*....*....*....*....*..*....*",
         "***..*....*....*.....***.*...****...*****...****...*....*",
      ];
      var x_start = Math.floor((pixelated_screen.width() - lines[0].length) / 2);
      var y = 20;
      _.each(lines, function(line) {
         var x = x_start; 
         _.each(line, function(pixel) {
            if(pixel === "*") {
               pixelated_screen.put_pixel(x, y, "#fff");
            }
            x += 1;
         });
         y += 1;
      });

      pixelated_screen.write_text_at("The game everyone should be talking about!",
                    g_Config.screen_width / 4, g_Config.screen_height / 4 * 3);

      pixelated_screen.write_text_at("Press 'r' to start the game.",
                    g_Config.screen_width / 4, g_Config.screen_height / 4 * 3 + 2);

      if (g_Config.has_local_storage) {
         var max_score = window.localStorage.getItem("max_score");
         if ( max_score !== null ) {
            pixelated_screen.write_text_at("Your max Score: " + max_score,
                                           g_Config.screen_width / 4, g_Config.screen_height / 4 * 3 + 4);
         } else {
            console.log("No recorded max score");
         }
      }
   };

   body(draw_ui, increase_score, reset_score, draw_game_restart_screen, increase_wave, draw_splash_screen, draw_on_screen_controls);
};

with_game_canvas( function(clear_screen, drawing_context, canvas) {
with_pixelated_screen(function(pixelated_screen) {
with_simetric_invaders(function(draw_invader) {
with_bullets(function(update_bullets, create_bullet, create_bomb, reset_targets, register_target, reset_bullets, reset_explosions) {
with_invasion(function(setup_invasion, draw_invasion, update_invasion, invasion_events) {
with_player_cannon(function(draw_player_cannon, player_action,
                            remaining_player_lives, reset_player_position,
                            reset_player_lives, player_events, increase_player_lives) {
with_ui(function(draw_ui, increase_score, reset_score, draw_game_restart_screen, increase_wave, draw_splash_screen,
                draw_on_screen_controls) {
with_key_bindings(function(bind_key) {
with_loop(100, function(interruptions, start_loop, pause_loop, restart_loop) {
      pixelated_screen.clear();
      draw_invasion();        // must be before player_cannon
      draw_player_cannon();
      update_invasion();
      update_bullets();
      draw_ui();

      _.each(player_events(), function(player_event) {
         if (interruptions[player_event]) {
            interruptions[player_event](start_loop, pause_loop, restart_loop);
         }
      });

      _.each(invasion_events(), function(invasion_event) {
         if (interruptions[invasion_event]) {
            interruptions[invasion_event](start_loop, pause_loop, restart_loop);
         }
      });
      
   },
   function(start_loop) { //before the loop
      reset_bullets();
      reset_player_position();
      reset_explosions();
      pixelated_screen.clear();
      draw_splash_screen();
      bind_key(g_keys.left, player_action.move_left);
      bind_key(g_keys.right, player_action.move_right);
      bind_key(g_keys.space, player_action.fire); 
      bind_key(g_keys.letter_f, go_full_screen); 
      bind_key(g_keys.letter_r, function() { reset_score(); setup_invasion(); draw_on_screen_controls(); start_loop(); });
   },{
      "player_loses_one_life": function(start_loop, pause_loop, restart_loop) {
         reset_bullets();
         reset_player_position();
      },
      "game_over": function(start_loop, pause_loop, restart_loop) {
         pause_loop();
         draw_game_restart_screen("Game over!");
         window.setTimeout(restart_loop, 2000);
      },
      "invasor_killed": function(start_loop, pause_loop, restart_loop) {
         increase_score(g_Config.invasor_kill_score);
      },
      "invasion_wave_cleared": function(start_loop, pause_loop) {
         increase_wave();
         reset_bullets();
         setup_invasion();
      },
}); //with_loop
}); //with_key_bindings
}, pixelated_screen, draw_invader, remaining_player_lives, increase_player_lives, player_action); //with_ui
}, draw_invader, create_bullet, register_target); //with_player_cannon
}, draw_invader, create_bomb, reset_targets, register_target); //with_invasion
}, pixelated_screen.put_pixel, pixelated_screen.get_pixel); //with_bullets
}, pixelated_screen.put_pixel); //with_simetric_invaders
}, canvas, drawing_context, clear_screen, g_Config.screen_width, g_Config.screen_height); //with_pixelated_screen
}); //with_game_canvas


/* Ein Klein Todo
 * After game over return to start screen
 */



// vim: expandtab
