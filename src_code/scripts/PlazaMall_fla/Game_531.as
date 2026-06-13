package PlazaMall_fla
{
   import flash.display.MovieClip;
   
   public dynamic class Game_531 extends MovieClip
   {
       
      
      public var lvSymbol;
      
      public var lv2:MovieClip;
      
      public var lv3:MovieClip;
      
      public var lv1:MovieClip;
      
      public function Game_531()
      {
         super();
         addFrameScript(0,frame1);
      }
      
      public function updateLevel(param1:Number) : void
      {
         var _loc2_:* = undefined;
         _loc2_ = 0;
         while(_loc2_ < lvSymbol.length)
         {
            if(_loc2_ < param1)
            {
               lvSymbol[_loc2_].gotoAndStop(2);
            }
            else
            {
               lvSymbol[_loc2_].gotoAndStop(1);
            }
            _loc2_++;
         }
      }
      
      function frame1() : *
      {
         lvSymbol = new Array();
         lvSymbol.push(lv1);
         lvSymbol.push(lv2);
         lvSymbol.push(lv3);
      }
   }
}
