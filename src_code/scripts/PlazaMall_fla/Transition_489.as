package PlazaMall_fla
{
   import flash.display.MovieClip;
   import flash.display.SimpleButton;
   import flash.events.MouseEvent;
   
   public dynamic class Transition_489 extends MovieClip
   {
       
      
      public var btnContinue:SimpleButton;
      
      public var gliderIcon:MovieClip;
      
      public var head;
      
      public function Transition_489()
      {
         super();
         addFrameScript(34,frame35,54,frame55,80,frame81);
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
      
      function frame35() : *
      {
         gliderIcon.gotoAndStop("landing");
      }
      
      function frame55() : *
      {
         stop();
         head = root;
         head.startCity = 2;
         head.gameLoaded = -1;
         btnContinue.addEventListener(MouseEvent.CLICK,BeginGame);
      }
   }
}
