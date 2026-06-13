package
{
   import flash.events.Event;
   
   public class VisitorNerd extends Visitor
   {
       
      
      public function VisitorNerd()
      {
         super();
         addFrameScript(0,frame1,1,frame2,2,frame3);
         interestList = new Array("btnBookStore","btnBookStore","btnBookStore","btnBookStore","btnDrugStore","btnCake","btnCake","btnSushi","Other");
         MAX_MOOD = 100;
         MIN_MOOD = 26;
         pattiene = 15;
         ACCEL_MOOD = 2;
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
