package PlazaMall_fla
{
   import flash.display.MovieClip;
   import flash.events.Event;
   
   public dynamic class Tips_592 extends MovieClip
   {
       
      
      public var diff;
      
      public var scrollBar:MovieClip;
      
      public var tips:MovieClip;
      
      public var head;
      
      public function Tips_592()
      {
         super();
         addFrameScript(0,frame1,1,frame2,10,frame11,11,frame12,22,frame23);
      }
      
      public function UpdatePosition(param1:Event) : void
      {
         if(scrollBar.visible)
         {
            tips.tipsList.y = 5 - diff * scrollBar.getPosition();
         }
      }
      
      function frame12() : *
      {
         checkHeight();
         stop();
      }
      
      function frame1() : *
      {
         stop();
      }
      
      public function checkHeight() : void
      {
         if(tips.tipsList.height > tips.writeArea.height - 10)
         {
            scrollBar.visible = true;
            diff = tips.tipsList.height - (tips.writeArea.height - 10);
         }
         else
         {
            scrollBar.visible = false;
            diff = 0;
         }
         scrollBar.btnScroll.y = scrollBar.line.y;
      }
      
      function frame23() : *
      {
         this.visible = false;
      }
      
      function frame2() : *
      {
         this.visible = true;
      }
      
      public function updateText(param1:Array) : void
      {
         var _loc2_:* = undefined;
         var _loc3_:* = undefined;
         if(currentLabel == "reveal")
         {
            _loc2_ = "";
            _loc3_ = 0;
            while(_loc3_ < param1.length)
            {
               if(_loc3_ == 0)
               {
                  _loc2_ = "-" + param1[_loc3_];
               }
               else
               {
                  _loc2_ += "\n\n-" + param1[_loc3_];
               }
               _loc3_++;
            }
            if(_loc2_ == "")
            {
               tips.tipsList.text = "Tips not found";
            }
            else
            {
               tips.tipsList.text = _loc2_;
            }
            checkHeight();
         }
      }
      
      function frame11() : *
      {
         diff = 0;
         head = root;
         updateText(head.tipsHistory);
         addEventListener(Event.ENTER_FRAME,UpdatePosition);
      }
   }
}
