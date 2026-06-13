package
{
   import flash.display.MovieClip;
   
   public dynamic class BuildBabyShop extends MovieClip
   {
       
      
      public var price;
      
      public var myParent;
      
      public var body:MovieClip;
      
      public function BuildBabyShop()
      {
         super();
         addFrameScript(0,frame1);
      }
      
      function frame1() : *
      {
         myParent = root;
         price = myParent.GENERAL_PRICE[1];
      }
   }
}
