package
{
   import flash.events.Event;
   
   public class VisitorNiggaFemale extends Visitor
   {
       
      
      public function VisitorNiggaFemale()
      {
         super();
         addFrameScript(0,frame1,1,frame2,2,frame3);
         interestList = new Array("btnSupermarket","btnSupermarket","btnSupermarket","btnSupermarket","btnBarberShop","btnBarberShop","btnIceCream","btnIceCream","btnCinema","Other");
         MAX_MOOD = 75;
         MIN_MOOD = 0;
         pattiene = 15;
         ACCEL_MOOD = 2.5;
         gender = false;
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
