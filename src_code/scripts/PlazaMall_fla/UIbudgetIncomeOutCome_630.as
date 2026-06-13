package PlazaMall_fla
{
   import flash.display.MovieClip;
   import flash.text.TextField;
   import flash.text.TextFieldAutoSize;
   
   public dynamic class UIbudgetIncomeOutCome_630 extends MovieClip
   {
       
      
      public var textList:TextField;
      
      public function UIbudgetIncomeOutCome_630()
      {
         super();
         addFrameScript(0,frame1);
      }
      
      function frame1() : *
      {
         textList.autoSize = TextFieldAutoSize.RIGHT;
         textList.mouseEnabled = false;
      }
   }
}
