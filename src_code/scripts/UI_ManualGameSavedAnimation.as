package
{
   import flash.display.MovieClip;
   
   public dynamic class UI_ManualGameSavedAnimation extends MovieClip
   {
       
      
      public function UI_ManualGameSavedAnimation()
      {
         super();
         addFrameScript(74,frame75);
      }
      
      function frame75() : *
      {
         stop();
         this.parent.removeChild(this);
      }
   }
}
