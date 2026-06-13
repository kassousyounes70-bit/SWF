package
{
   import flash.display.MovieClip;
   import flash.events.Event;
   import flash.events.KeyboardEvent;
   import flash.events.MouseEvent;
   
   public dynamic class GameOverScreen extends MovieClip
   {
       
      
      public function GameOverScreen()
      {
         super();
         addFrameScript(0,frame1,48,frame49,59,frame60);
      }
      
      function frame1() : *
      {
         stage.addEventListener(KeyboardEvent.KEY_UP,SkipAnimation);
         stage.addEventListener(MouseEvent.CLICK,SkipAnimation);
      }
      
      public function SkipAnimation(param1:Event) : void
      {
         gotoAndPlay("startBlink");
      }
      
      function frame49() : *
      {
         stage.removeEventListener(KeyboardEvent.KEY_UP,SkipAnimation);
         stage.removeEventListener(MouseEvent.CLICK,SkipAnimation);
         stage.addEventListener(KeyboardEvent.KEY_UP,BackToMainMenu);
         stage.addEventListener(MouseEvent.CLICK,BackToMainMenu);
      }
      
      public function BackToMainMenu(param1:Event) : void
      {
         var _loc2_:* = undefined;
         _loc2_ = root;
         stage.removeEventListener(KeyboardEvent.KEY_UP,BackToMainMenu);
         stage.removeEventListener(MouseEvent.CLICK,BackToMainMenu);
         this.parent.removeChild(this);
         _loc2_.BackToMainMenu();
      }
      
      function frame60() : *
      {
         gotoAndPlay("blink");
      }
   }
}
