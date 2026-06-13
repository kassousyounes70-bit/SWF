package
{
   import flash.display.MovieClip;
   import flash.events.Event;
   
   public dynamic class accArrow extends MovieClip
   {
       
      
      public var worldX;
      
      public var worldY;
      
      public var visitor;
      
      public function accArrow()
      {
         super();
         addFrameScript(0,frame1,56,frame57);
      }
      
      public function ChangePosition(param1:Event) : void
      {
         if(visitor != null)
         {
            worldX = visitor.worldX;
            worldY = visitor.worldY - visitor.height;
         }
      }
      
      function frame1() : *
      {
         addEventListener(Event.ENTER_FRAME,ChangePosition);
      }
      
      function frame57() : *
      {
         this.parent.removeChild(this);
         removeEventListener(Event.ENTER_FRAME,ChangePosition);
         stop();
      }
   }
}
