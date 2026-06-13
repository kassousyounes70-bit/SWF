package
{
   import flash.display.MovieClip;
   import flash.events.Event;
   
   public dynamic class BGStreet extends MovieClip
   {
       
      
      public var worldX:Number;
      
      public var worldY:Number;
      
      public var light:MovieClip;
      
      public var tree2:MovieClip;
      
      public var tree1:MovieClip;
      
      public var myParent;
      
      public var sakura1:MovieClip;
      
      public var sakura2:MovieClip;
      
      public function BGStreet()
      {
         super();
         addFrameScript(0,frame1);
      }
      
      function frame1() : *
      {
         myParent = root;
         addEventListener(Event.ENTER_FRAME,LightChange);
      }
      
      public function LightChange(param1:Event) : void
      {
         light.alpha = myParent.night.alpha;
      }
   }
}
