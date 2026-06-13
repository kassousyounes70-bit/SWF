package PlazaMall_fla
{
   import flash.display.MovieClip;
   import flash.events.Event;
   import flash.events.MouseEvent;
   import flash.geom.ColorTransform;
   
   public dynamic class Game_504 extends MovieClip
   {
       
      
      public var tog;
      
      public var canClick;
      
      public function Game_504()
      {
         super();
         addFrameScript(0,frame1,1,frame2,2,frame3);
      }
      
      public function activeButton() : void
      {
         var _loc1_:* = undefined;
         if(!canClick)
         {
            addEventListener(MouseEvent.CLICK,onMouseClick);
            canClick = true;
            _loc1_ = this.parent;
            _loc1_.transform.colorTransform = new ColorTransform(1,1,1,1,0,0,0,0);
         }
      }
      
      public function onMouseClick(param1:MouseEvent) : void
      {
         if(buttonMode)
         {
            tog = !tog;
         }
      }
      
      function frame3() : *
      {
         stop();
      }
      
      function frame1() : *
      {
         canClick = true;
         tog = false;
         stop();
         this.buttonMode = true;
         addEventListener(MouseEvent.CLICK,onMouseClick);
         addEventListener(Event.ENTER_FRAME,buttonAnimation);
      }
      
      function frame2() : *
      {
         stop();
      }
      
      public function buttonAnimation(param1:Event) : void
      {
         if(tog)
         {
            gotoAndPlay(3);
         }
         else
         {
            gotoAndPlay(2);
         }
      }
      
      public function deactiveButton() : void
      {
         var _loc1_:* = undefined;
         if(canClick)
         {
            removeEventListener(MouseEvent.CLICK,onMouseClick);
            canClick = false;
            _loc1_ = this.parent;
            _loc1_.transform.colorTransform = new ColorTransform(0.5,0.5,0.5,1,0,0,0,0);
         }
      }
   }
}
