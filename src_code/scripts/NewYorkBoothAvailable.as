package
{
   import flash.display.MovieClip;
   import flash.display.SimpleButton;
   import flash.events.MouseEvent;
   
   public dynamic class NewYorkBoothAvailable extends MovieClip
   {
       
      
      public var btnStartGame:SimpleButton;
      
      public var head;
      
      public function NewYorkBoothAvailable()
      {
         super();
         addFrameScript(12,frame13,25,frame26);
      }
      
      public function RemoveThisObject(param1:MouseEvent) : void
      {
         this.parent.removeChild(this);
      }
      
      function frame13() : *
      {
         head = root;
         btnStartGame.addEventListener(MouseEvent.CLICK,head.StartGame);
         btnStartGame.addEventListener(MouseEvent.CLICK,RemoveThisObject);
      }
      
      function frame26() : *
      {
         gotoAndPlay("BlinkStart");
      }
   }
}
