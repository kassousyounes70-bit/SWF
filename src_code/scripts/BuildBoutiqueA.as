package
{
   import flash.display.MovieClip;
   
   public dynamic class BuildBoutiqueA extends MovieClip
   {
       
      
      public var price;
      
      public var myParent;
      
      public var body:MovieClip;
      
      public function BuildBoutiqueA()
      {
         super();
         addFrameScript(0,frame1);
      }
      
      function frame1() : *
      {
         myParent = root;
         price = myParent.GENERAL_PRICE[3];
      }
   }
}
