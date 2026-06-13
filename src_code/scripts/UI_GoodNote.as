package
{
   import flash.display.MovieClip;
   import flash.events.Event;
   
   public dynamic class UI_GoodNote extends MovieClip
   {
       
      
      public var worldX;
      
      public var worldY;
      
      public var clip:MovieClip;
      
      public var largerClip:MovieClip;
      
      public var head;
      
      public function UI_GoodNote()
      {
         super();
         addFrameScript(0,frame1,30,frame31);
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
         largerClip.cashList.text = clip.cashList.text;
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
