package
{
   import flash.events.Event;
   
   public class VisitorCheer extends Visitor
   {
       
      
      public function VisitorCheer()
      {
         super();
         addFrameScript(0,frame1,1,frame2,2,frame3);
         interestList = new Array("btnBoutiqueA","btnBarberShop","btnJewelry","btnCafe","Other");
         MAX_MOOD = 100;
         MIN_MOOD = 26;
         pattiene = 5;
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
