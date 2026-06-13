package
{
   import flash.events.Event;
   
   public class VisitorAfro extends Visitor
   {
       
      
      public function VisitorAfro()
      {
         super();
         addFrameScript(0,frame1,1,frame2,2,frame3);
         interestList = new Array("btnCinema","btnCinema","btnSteak","btnSteak","Other");
         MAX_MOOD = 100;
         MIN_MOOD = 26;
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
