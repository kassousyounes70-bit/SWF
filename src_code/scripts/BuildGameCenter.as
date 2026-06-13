package
{
   import flash.display.MovieClip;
   
   public dynamic class BuildGameCenter extends MovieClip
   {
       
      
      public var price;
      
      public var myParent;
      
      public var body:MovieClip;
      
      public function BuildGameCenter()
      {
         super();
         addFrameScript(0,frame1);
      }
      
      function frame1() : *
      {
         myParent = root;
         price = myParent.ENTERTAINMENT_PRICE[1];
      }
   }
}
