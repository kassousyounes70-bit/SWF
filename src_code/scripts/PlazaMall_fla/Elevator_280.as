package PlazaMall_fla
{
   import flash.display.MovieClip;
   
   public dynamic class Elevator_280 extends MovieClip
   {
       
      
      public var myParent;
      
      public function Elevator_280()
      {
         super();
         addFrameScript(24,frame25);
      }
      
      function frame25() : *
      {
         myParent = this.parent.parent;
         myParent.isOpen = false;
      }
   }
}
