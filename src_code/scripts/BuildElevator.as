package
{
   import flash.display.MovieClip;
   
   public dynamic class BuildElevator extends MovieClip
   {
       
      
      public var price;
      
      public var myParent;
      
      public var body:ElevatorMain;
      
      public var body2:ElevatorMain;
      
      public function BuildElevator()
      {
         super();
         addFrameScript(0,frame1);
      }
      
      function frame1() : *
      {
         myParent = root;
         price = myParent.SUPPORT_PRICE[0];
      }
   }
}
