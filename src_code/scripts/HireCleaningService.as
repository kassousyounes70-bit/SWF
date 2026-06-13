package
{
   import flash.display.MovieClip;
   
   public dynamic class HireCleaningService extends MovieClip
   {
       
      
      public var price;
      
      public var stat;
      
      public var myParent;
      
      public var body:MovieClip;
      
      public function HireCleaningService()
      {
         super();
         addFrameScript(0,frame1);
      }
      
      function frame1() : *
      {
         myParent = root;
         price = myParent.EMPLOYEE_PRICE[0];
      }
   }
}
