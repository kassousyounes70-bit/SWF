package PlazaMall_fla
{
   import flash.display.MovieClip;
   import flash.text.TextField;
   import flash.text.TextFieldAutoSize;
   
   public dynamic class UI_102 extends MovieClip
   {
       
      
      public var upgradeCost:TextField;
      
      public var otherNote:TextField;
      
      public var upgradeCapacity:TextField;
      
      public function UI_102()
      {
         super();
         addFrameScript(0,frame1);
      }
      
      function frame1() : *
      {
         upgradeCapacity.autoSize = TextFieldAutoSize.LEFT;
         upgradeCost.autoSize = TextFieldAutoSize.LEFT;
         otherNote.autoSize = TextFieldAutoSize.LEFT;
      }
   }
}
