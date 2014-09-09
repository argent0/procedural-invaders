var with_loop = function (interval, loop_body, before) {

   var advance_step = function(){
      loop_body();
   };

   var continue_loop = function() {
      //Function.prototype.call(after);
      advance_step();
         window.setTimeout(continue_loop, interval);
   };

   continue_loop();
   before(advance_step, continue_loop);
};
// vim: expandtab
