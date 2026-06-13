package PlazaMall_fla
{
   import flash.display.MovieClip;
   
   public dynamic class Achievement_79 extends MovieClip
   {
       
      
      public var notice:MovieClip;
      
      public var iconClip:MovieClip;
      
      public var iconPosition;
      
      public function Achievement_79()
      {
         super();
         addFrameScript(0,frame1);
      }
      
      function frame1() : *
      {
         iconClip.gotoAndStop(iconPosition);
         notice.gotoAndStop(iconPosition);
      }
   }
}
