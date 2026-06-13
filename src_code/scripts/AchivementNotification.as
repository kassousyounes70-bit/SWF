package
{
   import flash.display.MovieClip;
   
   public dynamic class AchivementNotification extends MovieClip
   {
       
      
      public var body:MovieClip;
      
      public function AchivementNotification()
      {
         super();
         addFrameScript(69,frame70);
      }
      
      function frame70() : *
      {
         stop();
         this.parent.removeChild(this);
      }
   }
}
