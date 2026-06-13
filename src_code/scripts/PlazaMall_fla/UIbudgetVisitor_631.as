package PlazaMall_fla
{
   import flash.display.MovieClip;
   import flash.text.TextField;
   import flash.text.TextFieldAutoSize;
   
   public dynamic class UIbudgetVisitor_631 extends MovieClip
   {
       
      
      public var textList:TextField;
      
      public function UIbudgetVisitor_631()
      {
         super();
         addFrameScript(0,frame1);
      }
      
      function frame1() : *
      {
         textList.autoSize = TextFieldAutoSize.CENTER;
         textList.mouseEnabled = false;
      }
   }
}
