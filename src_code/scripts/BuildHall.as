package
{
   import flash.display.MovieClip;
   
   public dynamic class BuildHall extends MovieClip
   {
       
      
      public var price;
      
      public var myParent;
      
      public var body:MovieClip;
      
      public function BuildHall()
      {
         super();
         addFrameScript(0,frame1);
      }
      
      function frame1() : *
      {
         myParent = root;
         price = myParent.ENTERTAINMENT_PRICE[2];
      }
   }
}
