var with_loop = function (interval, loop_body, before, interruptions) {
   /* Interruptions
    * {"event": callback }
    */

   var _timeout_id = 0;
   var _loop_body = loop_body;
   var _paused = false;

   var pause_loop = function() {
      window.clearTimeout(_timeout_id);
      _paused = true;
   };

   var restart_loop = function() {
      _paused = false;
      before(start_loop);
   };

   var advance_step = function(){
      _loop_body(interruptions, start_loop, pause_loop, restart_loop);
   };

   var start_loop = function() {
      //Function.prototype.call(after);
      advance_step();
      if (!_paused)  {
         _timeout_id = window.setTimeout(start_loop, interval);
      }
   };


   before(start_loop);
};
// vim: expandtab
