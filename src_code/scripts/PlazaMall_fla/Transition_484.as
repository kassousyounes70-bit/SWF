package PlazaMall_fla
{
   import flash.display.MovieClip;
   import flash.display.SimpleButton;
   import flash.events.MouseEvent;
   
   public dynamic class Transition_484 extends MovieClip
   {
       
      
      public var btnContinue:SimpleButton;
      
      public var head;
      
      public function Transition_484()
      {
         super();
         addFrameScript(54,frame55,80,frame81);
      }
      
      public function BeginGame(param1:MouseEvent) : void
      {
         var _loc2_:* = undefined;
         _loc2_ = param1.currentTarget;
         _loc2_.removeEventListener(MouseEvent.CLICK,BeginGame);
         gotoAndPlay("Next Frame");
      }
      
      function frame81() : *
      {
         head.gotoAndPlay("Main Program");
      }
      
      function frame55() : *
      {
         stop();
         head = root;
         head.startCity = 1;
         head.gameLoaded = -1;
         btnContinue.addEventListener(MouseEvent.CLICK,BeginGame);
      }
   }
}
