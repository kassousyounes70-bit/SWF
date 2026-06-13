package
{
   import flash.display.MovieClip;
   
   public dynamic class TipsNote extends MovieClip
   {
       
      
      public var note:MovieClip;
      
      public function TipsNote()
      {
         super();
         addFrameScript(148,frame149);
      }
      
      function frame149() : *
      {
         stop();
         this.parent.removeChild(this);
      }
   }
}
