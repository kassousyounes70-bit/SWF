package
{
   import flash.display.MovieClip;
   import flash.events.MouseEvent;
   
   public dynamic class BeginingTutorial extends MovieClip
   {
       
      
      public var btnStartGame:MovieClip;
      
      public var head;
      
      public function BeginingTutorial()
      {
         super();
         addFrameScript(0,frame1,11,frame12);
      }
      
      public function RemoveThisObject(param1:MouseEvent) : void
      {
         this.parent.removeChild(this);
      }
      
      function frame12() : *
      {
         gotoAndPlay("BlinkStart");
      }
      
      function frame1() : *
      {
         head = root;
         btnStartGame.buttonMode = true;
         btnStartGame.addEventListener(MouseEvent.CLICK,head.StartGame);
         btnStartGame.addEventListener(MouseEvent.CLICK,RemoveThisObject);
      }
   }
}
