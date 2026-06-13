package PlazaMall_fla
{
   import flash.display.MovieClip;
   import flash.text.TextField;
   import flash.text.TextFieldAutoSize;
   
   public dynamic class Tips_597 extends MovieClip
   {
       
      
      public var writeArea:MovieClip;
      
      public var tipsList:TextField;
      
      public function Tips_597()
      {
         super();
         addFrameScript(0,frame1);
      }
      
      function frame1() : *
      {
         tipsList.autoSize = TextFieldAutoSize.LEFT;
         tipsList.mouseEnabled = false;
      }
   }
}
