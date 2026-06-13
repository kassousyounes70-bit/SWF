package PlazaMall_fla
{
   import flash.display.MovieClip;
   import flash.events.MouseEvent;
   import flash.text.TextField;
   
   public dynamic class UI_576 extends MovieClip
   {
       
      
      public var hightlighted:MovieClip;
      
      public var Note:TextField;
      
      public var btnTemp:MovieClip;
      
      public var iconSymbol:MovieClip;
      
      public var Amount:TextField;
      
      public function UI_576()
      {
         super();
         addFrameScript(0,frame1);
      }
      
      public function Hightlighted(param1:MouseEvent) : void
      {
         var _loc2_:* = undefined;
         hightlighted.visible = true;
         _loc2_ = root;
         _loc2_.menuOver = true;
      }
      
      public function Unhightlighted(param1:MouseEvent) : void
      {
         var _loc2_:* = undefined;
         hightlighted.visible = false;
         _loc2_ = root;
         _loc2_.menuOver = false;
      }
      
      function frame1() : *
      {
         btnTemp.buttonMode = true;
         hightlighted.visible = false;
         addEventListener(MouseEvent.MOUSE_OVER,Hightlighted);
         addEventListener(MouseEvent.MOUSE_OUT,Unhightlighted);
      }
   }
}
