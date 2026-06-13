package
{
   import flash.display.MovieClip;
   
   public dynamic class cloudGame extends MovieClip
   {
       
      
      public var speed;
      
      public var sunset:MovieClip;
      
      public var normal:MovieClip;
      
      public function cloudGame()
      {
         super();
         addFrameScript(0,frame1);
      }
      
      function frame1() : *
      {
         stop();
      }
   }
}
