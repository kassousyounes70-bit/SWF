package
{
   import flash.display.MovieClip;
   import flash.text.TextField;
   import flash.text.TextFieldAutoSize;
   
   public dynamic class LegendWideBox extends MovieClip
   {
       
      
      public var alignment;
      
      public var legendOpen:MovieClip;
      
      public var legendClose:MovieClip;
      
      public var commentText;
      
      public var legendExtension:MovieClip;
      
      public var legendText:TextField;
      
      public function LegendWideBox()
      {
         super();
         addFrameScript(0,frame1);
      }
      
      function frame1() : *
      {
         if(alignment == "Left")
         {
            legendText.autoSize = TextFieldAutoSize.LEFT;
         }
         else if(alignment == "Center")
         {
            legendText.autoSize = TextFieldAutoSize.CENTER;
         }
         else if(alignment == "Right")
         {
            legendText.autoSize = TextFieldAutoSize.RIGHT;
         }
         else
         {
            legendText.autoSize = TextFieldAutoSize.CENTER;
         }
         legendText.text = commentText;
         if(legendText.autoSize == TextFieldAutoSize.LEFT)
         {
            legendExtension.width = legendText.width;
            legendExtension.x = 0;
            legendOpen.x = -legendOpen.width;
            legendClose.x = legendExtension.width;
         }
         else
         {
            legendExtension.width = legendText.width;
            legendExtension.x = legendText.x;
            legendOpen.x = legendExtension.x - legendOpen.width;
            legendClose.x = legendExtension.x + legendExtension.width;
         }
      }
   }
}
