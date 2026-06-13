package PlazaMall_fla
{
   import flash.display.MovieClip;
   import flash.display.SimpleButton;
   import flash.display.StageQuality;
   import flash.events.MouseEvent;
   
   public dynamic class UI_607 extends MovieClip
   {
       
      
      public var btnHighQuality:SimpleButton;
      
      public var highlightedLow:MovieClip;
      
      public var btnLowQuality:SimpleButton;
      
      public var highlightedHigh:MovieClip;
      
      public var highlightedMedium:MovieClip;
      
      public var btnMediumQuality:SimpleButton;
      
      public function UI_607()
      {
         super();
         addFrameScript(0,frame1);
      }
      
      function frame1() : *
      {
         highlightedHigh.visible = stage.quality.toUpperCase() == StageQuality.HIGH.toUpperCase();
         highlightedMedium.visible = stage.quality.toUpperCase() == StageQuality.MEDIUM.toUpperCase();
         highlightedLow.visible = stage.quality.toUpperCase() == StageQuality.LOW.toUpperCase();
         btnHighQuality.addEventListener(MouseEvent.CLICK,UpdateQuality);
         btnMediumQuality.addEventListener(MouseEvent.CLICK,UpdateQuality);
         btnLowQuality.addEventListener(MouseEvent.CLICK,UpdateQuality);
      }
      
      public function UpdateQuality(param1:MouseEvent) : void
      {
         var _loc2_:* = undefined;
         _loc2_ = param1.currentTarget;
         highlightedHigh.visible = _loc2_.name == "btnHighQuality";
         highlightedMedium.visible = _loc2_.name == "btnMediumQuality";
         highlightedLow.visible = _loc2_.name == "btnLowQuality";
         if(highlightedHigh.visible)
         {
            stage.quality = StageQuality.HIGH;
         }
         else if(highlightedMedium.visible)
         {
            stage.quality = StageQuality.MEDIUM;
         }
         else if(highlightedLow.visible)
         {
            stage.quality = StageQuality.LOW;
         }
      }
   }
}
