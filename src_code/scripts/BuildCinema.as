package
{
   import flash.display.MovieClip;
   
   public dynamic class BuildCinema extends MovieClip
   {
       
      
      public var price;
      
      public var myParent;
      
      public var body:MovieClip;
      
      public function BuildCinema()
      {
         super();
         addFrameScript(0,frame1);
      }
      
      function frame1() : *
      {
         myParent = root;
         price = myParent.ENTERTAINMENT_PRICE[0];
      }
   }
}
