package PlazaMall_fla
{
   import flash.display.MovieClip;
   import flash.text.TextField;
   import flash.text.TextFieldAutoSize;
   
   public dynamic class UI_52 extends MovieClip
   {
       
      
      public var cashList:TextField;
      
      public function UI_52()
      {
         super();
         addFrameScript(0,frame1);
      }
      
      function frame1() : *
      {
         cashList.autoSize = TextFieldAutoSize.CENTER;
      }
   }
}
