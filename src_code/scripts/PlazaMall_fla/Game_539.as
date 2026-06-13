package PlazaMall_fla
{
   import flash.display.MovieClip;
   
   public dynamic class Game_539 extends MovieClip
   {
       
      
      public var relation;
      
      public var stanby:MovieClip;
      
      public var work:MovieClip;
      
      public var colorMod;
      
      public var walk:MovieClip;
      
      public function Game_539()
      {
         super();
         addFrameScript(0,frame1,1,frame2,2,frame3);
      }
      
      function frame3() : *
      {
         work.visible = false;
         stanby.visible = false;
         walk.visible = false;
         stop();
      }
      
      function frame1() : *
      {
         work.visible = false;
         stanby.visible = false;
         walk.visible = false;
         stop();
      }
      
      function frame2() : *
      {
         work.visible = false;
         stanby.visible = false;
         walk.visible = false;
         stop();
      }
   }
}
