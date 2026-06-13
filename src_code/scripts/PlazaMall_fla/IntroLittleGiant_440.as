package PlazaMall_fla
{
   import flash.display.MovieClip;
   import flash.media.SoundTransform;
   
   public dynamic class IntroLittleGiant_440 extends MovieClip
   {
       
      
      public var seTrans;
      
      public var vol;
      
      public var head;
      
      public var newSE;
      
      public function IntroLittleGiant_440()
      {
         super();
         addFrameScript(0,frame1,1,frame2,97,frame98,142,frame143);
      }
      
      function frame143() : *
      {
         head = root;
         head.play();
         stop();
      }
      
      function frame98() : *
      {
         newSE = new SE_Intro_Explode();
         newSE.play(0,0,seTrans);
      }
      
      function frame1() : *
      {
         seTrans = new SoundTransform();
      }
      
      function frame2() : *
      {
         if(!vol && vol != 0)
         {
            vol = 1;
         }
         seTrans.volume = vol;
      }
   }
}
