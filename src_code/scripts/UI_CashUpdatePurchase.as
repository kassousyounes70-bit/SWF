package
{
   import flash.display.MovieClip;
   import flash.events.Event;
   
   public dynamic class UI_CashUpdatePurchase extends MovieClip
   {
       
      
      public var worldX;
      
      public var worldY;
      
      public var dyMod;
      
      public var beginAlpha;
      
      public var clip:MovieClip;
      
      public var scaleMod;
      
      public var dy;
      
      public var dx;
      
      public var alphaMod;
      
      public var head;
      
      public function UI_CashUpdatePurchase()
      {
         super();
         addFrameScript(0,frame1,24,frame25);
      }
      
      public function UpdatePosition(param1:Event) : void
      {
         this.x = worldX - head.cameraX;
         this.y = worldY - head.cameraY;
         this.visible = head.drawArea.hitTestObject(this);
         clip.x += dx;
         clip.y -= dy;
         clip.scaleX += scaleMod;
         clip.scaleY += scaleMod;
         dy -= dyMod;
         if(this.currentFrame > beginAlpha)
         {
            this.alpha -= alphaMod;
         }
      }
      
      function frame1() : *
      {
         dy = 8;
         scaleMod = 0.5 / this.totalFrames;
         dyMod = dy / (this.totalFrames - 10);
         beginAlpha = 20;
         alphaMod = 1 / (this.totalFrames - beginAlpha);
         head = root;
         dx = (Math.floor(Math.random() * 2) * 2 - 1) * 2;
         addEventListener(Event.ENTER_FRAME,UpdatePosition);
      }
      
      function frame25() : *
      {
         stop();
         removeEventListener(Event.ENTER_FRAME,UpdatePosition);
         this.parent.removeChild(this);
      }
   }
}
