package PlazaMall_fla
{
   import flash.display.MovieClip;
   import flash.text.TextField;
   import flash.text.TextFieldAutoSize;
   
   public dynamic class UI_121 extends MovieClip
   {
       
      
      public var upgradeSalary:TextField;
      
      public var upgradeCost:TextField;
      
      public var otherNote:TextField;
      
      public function UI_121()
      {
         super();
         addFrameScript(0,frame1);
      }
      
      function frame1() : *
      {
         upgradeSalary.autoSize = TextFieldAutoSize.LEFT;
         otherNote.autoSize = TextFieldAutoSize.LEFT;
         upgradeCost.autoSize = TextFieldAutoSize.LEFT;
      }
   }
}
