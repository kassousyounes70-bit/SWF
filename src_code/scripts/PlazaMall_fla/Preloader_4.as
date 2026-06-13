package PlazaMall_fla
{
   import flash.display.MovieClip;
   import flash.events.MouseEvent;
   import flash.net.URLRequest;
   import flash.net.navigateToURL;
   
   public dynamic class Preloader_4 extends MovieClip
   {
       
      
      public function Preloader_4()
      {
         super();
         addFrameScript(0,frame1);
      }
      
      function frame1() : *
      {
         buttonMode = true;
         addEventListener(MouseEvent.CLICK,GamesfreeURL);
      }
      
      public function GamesfreeURL(param1:MouseEvent) : void
      {
         var _loc2_:URLRequest = null;
         _loc2_ = new URLRequest("http://www.gamesfree.com");
         navigateToURL(_loc2_,"_blank");
      }
   }
}
