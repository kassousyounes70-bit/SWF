package
{
   import flash.display.MovieClip;
   
   public dynamic class HireTechnician extends MovieClip
   {
       
      
      public var price;
      
      public var stat;
      
      public var myParent;
      
      public var body:MovieClip;
      
      public function HireTechnician()
      {
         super();
         addFrameScript(0,frame1);
      }
      
      function frame1() : *
      {
         myParent = root;
         price = myParent.EMPLOYEE_PRICE[1];
      }
   }
}
