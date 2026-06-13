package
{
   import flash.display.MovieClip;
   
   public dynamic class fx_smoke extends MovieClip
   {
       
      
      public var worldX;
      
      public var worldY;
      
      public function fx_smoke()
      {
         super();
         addFrameScript(0,frame1,7,frame8);
      }
      
      function frame1() : *
      {
      }
      
      function frame8() : *
      {
         stop();
         this.parent.removeChild(this);
      }
   }
}
