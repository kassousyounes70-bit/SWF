package PlazaMall_fla
{
   import flash.display.MovieClip;
   import flash.display.SimpleButton;
   import flash.events.MouseEvent;
   
   public dynamic class Option_471 extends MovieClip
   {
       
      
      public var btnBack:SimpleButton;
      
      public function Option_471()
      {
         super();
         addFrameScript(0,frame1);
      }
      
      function frame1() : *
      {
         btnBack.addEventListener(MouseEvent.CLICK,BackToMainMenu);
      }
      
      public function BackToMainMenu(param1:MouseEvent) : void
      {
         var _loc2_:* = undefined;
         _loc2_ = this.parent;
         _loc2_.gotoAndPlay("Exit Option");
      }
   }
}
