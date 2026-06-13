package PlazaMall_fla
{
   import flash.display.MovieClip;
   import flash.text.TextField;
   import flash.text.TextFieldAutoSize;
   
   public dynamic class Game_524 extends MovieClip
   {
       
      
      public var jobDesk:TextField;
      
      public function Game_524()
      {
         super();
         addFrameScript(0,frame1);
      }
      
      function frame1() : *
      {
         jobDesk.autoSize = TextFieldAutoSize.CENTER;
      }
   }
}
