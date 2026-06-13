package PlazaMall_fla
{
   import flash.display.MovieClip;
   import flash.text.TextField;
   import flash.text.TextFieldAutoSize;
   
   public dynamic class UIbudgetDiscription_632 extends MovieClip
   {
       
      
      public var writeArea:MovieClip;
      
      public var textList:TextField;
      
      public function UIbudgetDiscription_632()
      {
         super();
         addFrameScript(0,frame1);
      }
      
      function frame1() : *
      {
         textList.autoSize = TextFieldAutoSize.LEFT;
         textList.mouseEnabled = false;
      }
   }
}
