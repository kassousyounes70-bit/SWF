package
{
   import flash.display.MovieClip;
   import flash.events.Event;
   
   public dynamic class UI_CashUpdateRecive extends MovieClip
   {
       
      
      public var worldX;
      
      public var worldY;
      
      public var clip:MovieClip;
      
      public var staticPosition;
      
      public var head;
      
      public function UI_CashUpdateRecive()
      {
         super();
         addFrameScript(0,frame1,30,frame31);
      }
      
      public function UpdatePosition(param1:Event) : void
      {
         if(staticPosition)
         {
            this.x = worldX;
            this.y = worldY;
         }
         else
         {
            this.x = worldX - head.cameraX;
            this.y = worldY - head.cameraY;
         }
         this.visible = head.drawArea.hitTestObject(this);
      }
      
      function frame1() : *
      {
         head = root;
         addEventListener(Event.ENTER_FRAME,UpdatePosition);
      }
      
      function frame31() : *
      {
         stop();
         removeEventListener(Event.ENTER_FRAME,UpdatePosition);
         this.parent.removeChild(this);
      }
   }
}
