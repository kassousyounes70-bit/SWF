package
{
   import flash.display.MovieClip;
   
   public dynamic class BuildCafe extends MovieClip
   {
       
      
      public var price;
      
      public var myParent;
      
      public var body:MovieClip;
      
      public function BuildCafe()
      {
         super();
         addFrameScript(0,frame1);
      }
      
      function frame1() : *
      {
         myParent = root;
         price = myParent.FOOD_PRICE[5];
      }
   }
}
