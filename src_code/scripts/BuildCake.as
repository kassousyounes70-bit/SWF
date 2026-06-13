package
{
   import flash.display.MovieClip;
   
   public dynamic class BuildCake extends MovieClip
   {
       
      
      public var price;
      
      public var myParent;
      
      public var body:MovieClip;
      
      public function BuildCake()
      {
         super();
         addFrameScript(0,frame1);
      }
      
      function frame1() : *
      {
         myParent = root;
         price = myParent.FOOD_PRICE[0];
      }
   }
}
