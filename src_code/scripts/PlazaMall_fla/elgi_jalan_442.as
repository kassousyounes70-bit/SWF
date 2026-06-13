package PlazaMall_fla
{
   import flash.display.MovieClip;
   
   public dynamic class elgi_jalan_442 extends MovieClip
   {
       
      
      public var myParent;
      
      public var newSE;
      
      public function elgi_jalan_442()
      {
         super();
         addFrameScript(0,frame1,6,frame7);
      }
      
      function frame7() : *
      {
         newSE = new SE_Intro_Walk();
         newSE.play(0,0,myParent.seTrans);
      }
      
      function frame1() : *
      {
         myParent = this.parent;
         newSE = new SE_Intro_Walk();
         newSE.play(0,0,myParent.seTrans);
      }
   }
}
