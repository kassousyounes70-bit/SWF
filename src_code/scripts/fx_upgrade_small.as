package
{
   import flash.display.MovieClip;
   
   public dynamic class fx_upgrade_small extends MovieClip
   {
       
      
      public function fx_upgrade_small()
      {
         super();
         addFrameScript(14,frame15);
      }
      
      function frame15() : *
      {
         stop();
         this.parent.removeChild(this);
      }
   }
}
