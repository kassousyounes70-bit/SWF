package
{
   import flash.display.MovieClip;
   
   public dynamic class fx_upgrade_medium extends MovieClip
   {
       
      
      public function fx_upgrade_medium()
      {
         super();
         addFrameScript(14,frame15);
      }
      
      function frame15() : *
      {
         stop();
         parent.removeChild(this);
      }
   }
}
