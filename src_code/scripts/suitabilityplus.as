package
{
   import flash.display.MovieClip;
   import flash.events.Event;
   
   public dynamic class suitabilityplus extends MovieClip
   {
       
      
      public var worldX;
      
      public var worldY;
      
      public var head;
      
      public function suitabilityplus()
      {
         super();
         addFrameScript(0,frame1,39,frame40);
      }
      
      public function UpdatePosition(param1:Event) : void
      {
         this.x = worldX - head.cameraX;
         this.y = worldY - head.cameraY;
         this.visible = head.drawArea.hitTestObject(this);
      }
      
      function frame1() : *
      {
         head = root;
         addEventListener(Event.ENTER_FRAME,UpdatePosition);
      }
      
      function frame40() : *
      {
         stop();
         removeEventListener(Event.ENTER_FRAME,UpdatePosition);
         this.parent.removeChild(this);
      }
   }
}
