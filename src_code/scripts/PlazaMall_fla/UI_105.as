package PlazaMall_fla
{
   import flash.display.MovieClip;
   import flash.text.TextField;
   import flash.text.TextFieldAutoSize;
   
   public dynamic class UI_105 extends MovieClip
   {
       
      
      public var capacity:TextField;
      
      public function UI_105()
      {
         super();
         addFrameScript(0,frame1);
      }
      
      function frame1() : *
      {
         capacity.autoSize = TextFieldAutoSize.LEFT;
      }
   }
}
