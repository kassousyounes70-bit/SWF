package PlazaMall_fla
{
   import flash.display.MovieClip;
   import flash.events.MouseEvent;
   import flash.net.URLRequest;
   import flash.net.navigateToURL;
   
   public dynamic class Transation_487 extends MovieClip
   {
       
      
      public function Transation_487()
      {
         super();
         addFrameScript(0,frame1);
      }
      
      public function link(param1:MouseEvent) : void
      {
         var _loc2_:URLRequest = null;
         _loc2_ = new URLRequest("http://www.gamesfree.com");
         navigateToURL(_loc2_,"_blank");
      }
      
      function frame1() : *
      {
         buttonMode = true;
         this.addEventListener(MouseEvent.CLICK,link);
      }
   }
}
