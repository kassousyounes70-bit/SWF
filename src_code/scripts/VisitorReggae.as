package
{
   import flash.events.Event;
   
   public class VisitorReggae extends Visitor
   {
       
      
      public function VisitorReggae()
      {
         super();
         addFrameScript(0,frame1,1,frame2,2,frame3);
         interestList = new Array("btnCafe","btnCafe","btnCafe","btnDrugStore","btnDrugStore","btnDrugStore","btnBarberShop","btnBarberShop","btnBarberShop","Other");
         MAX_MOOD = 75;
         MIN_MOOD = 0;
         pattiene = 10;
         ACCEL_MOOD = 1;
         gender = true;
         addEventListener(Event.ADDED,Initialize);
      }
      
      function frame1() : *
      {
         stop();
      }
      
      function frame3() : *
      {
         stop();
      }
      
      function frame2() : *
      {
         stop();
      }
   }
}
