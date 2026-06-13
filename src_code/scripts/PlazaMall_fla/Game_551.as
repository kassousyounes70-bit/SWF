package PlazaMall_fla
{
   import flash.display.MovieClip;
   
   public dynamic class Game_551 extends MovieClip
   {
       
      
      public var sectorList:MovieClip;
      
      public function Game_551()
      {
         super();
         addFrameScript(5,frame6,10,frame11);
      }
      
      function frame6() : *
      {
         stop();
      }
      
      function frame11() : *
      {
         this.visible = false;
         sectorList.disableAllButton();
      }
   }
}
