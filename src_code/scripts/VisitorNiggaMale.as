package
{
   import flash.events.Event;
   
   public class VisitorNiggaMale extends Visitor
   {
       
      
      public function VisitorNiggaMale()
      {
         super();
         addFrameScript(0,frame1,1,frame2,2,frame3);
         interestList = new Array("btnSupermarket","btnSupermarket","btnSupermarket","btnBoutiqueB","btnBoutiqueB","btnBoutiqueB","btnSteak","btnSteak","btnSteak","Other");
         MAX_MOOD = 100;
         MIN_MOOD = 26;
         pattiene = 10;
         ACCEL_MOOD = 0.5;
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
