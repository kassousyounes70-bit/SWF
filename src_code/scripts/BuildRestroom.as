package
{
   import flash.display.MovieClip;
   
   public dynamic class BuildRestroom extends MovieClip
   {
       
      
      public var price;
      
      public var myParent;
      
      public var body:MovieClip;
      
      public function BuildRestroom()
      {
         super();
         addFrameScript(0,frame1);
      }
      
      function frame1() : *
      {
         myParent = root;
         price = myParent.SUPPORT_PRICE[1];
      }
   }
}
