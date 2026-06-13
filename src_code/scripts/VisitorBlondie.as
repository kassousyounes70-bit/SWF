package
{
   import flash.events.Event;
   
   public class VisitorBlondie extends Visitor
   {
       
      
      public function VisitorBlondie()
      {
         super();
         addFrameScript(0,frame1,1,frame2,2,frame3);
         interestList = new Array("btnBoutiqueB","btnBoutiqueB","btnBoutiqueB","btnBoutiqueB","btnBarberShop","btnBarberShop","btnBarberShop","btnBarberShop","btnBarberShop","btnBabyShop","Other");
         MAX_MOOD = 100;
         MIN_MOOD = 26;
         pattiene = 20;
         ACCEL_MOOD = 1.5;
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
