package PlazaMall_fla
{
   import flash.display.MovieClip;
   import flash.events.Event;
   
   public dynamic class shop_295 extends MovieClip
   {
       
      
      public var pillarLamp:MovieClip;
      
      public var artistMale:MovieClip;
      
      public var tParent;
      
      public var lamp3:MovieClip;
      
      public var lamp5:MovieClip;
      
      public var lamp7:MovieClip;
      
      public var lamp4:MovieClip;
      
      public var lamp2:MovieClip;
      
      public var lamp6:MovieClip;
      
      public var lamp9:MovieClip;
      
      public var lamp1:MovieClip;
      
      public var objectList;
      
      public var artistFemale:MovieClip;
      
      public var lamp8:MovieClip;
      
      public var i;
      
      public function shop_295()
      {
         super();
         addFrameScript(0,frame1);
      }
      
      public function CheckCondition(param1:Event) : void
      {
         var _loc2_:* = undefined;
         if(tParent.isClose)
         {
            _loc2_ = 0;
            while(_loc2_ < objectList.length)
            {
               if(objectList[_loc2_].alpha > 0)
               {
                  objectList[_loc2_].alpha -= 0.1;
               }
               else
               {
                  objectList[_loc2_].visible = false;
               }
               _loc2_++;
            }
         }
         else
         {
            _loc2_ = 0;
            while(_loc2_ < objectList.length)
            {
               objectList[_loc2_].visible = true;
               if(objectList[_loc2_].alpha < 1)
               {
                  objectList[_loc2_].alpha += 0.1;
               }
               _loc2_++;
            }
         }
      }
      
      function frame1() : *
      {
         tParent = this.parent;
         objectList = new Array();
         objectList.push(lamp1);
         objectList.push(lamp2);
         objectList.push(lamp3);
         objectList.push(lamp4);
         objectList.push(lamp5);
         objectList.push(lamp6);
         objectList.push(lamp7);
         objectList.push(lamp8);
         objectList.push(lamp9);
         objectList.push(pillarLamp);
         objectList.push(artistMale);
         objectList.push(artistFemale);
         i = 0;
         while(i < objectList.length)
         {
            objectList[i].visible = false;
            objectList[i].alpha = 0;
            ++i;
         }
         addEventListener(Event.ENTER_FRAME,CheckCondition);
      }
   }
}
