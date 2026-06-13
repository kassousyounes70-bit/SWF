package
{
   import flash.display.MovieClip;
   
   public dynamic class BuildJewelry extends MovieClip
   {
       
      
      public var price;
      
      public var myParent;
      
      public var body:MovieClip;
      
      public function BuildJewelry()
      {
         super();
         addFrameScript(0,frame1);
      }
      
      function frame1() : *
      {
         myParent = root;
         price = myParent.GENERAL_PRICE[7];
      }
   }
}
