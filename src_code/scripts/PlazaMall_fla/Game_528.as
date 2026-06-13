package PlazaMall_fla
{
   import flash.display.MovieClip;
   import flash.display.SimpleButton;
   import flash.text.TextField;
   
   public dynamic class Game_528 extends MovieClip
   {
       
      
      public var btnUpFloor:SimpleButton;
      
      public var btnDownFloor:SimpleButton;
      
      public var floorList:TextField;
      
      public function Game_528()
      {
         super();
         addFrameScript(0,frame1);
      }
      
      function frame1() : *
      {
         stop();
      }
   }
}
