package
{
   import flash.events.Event;
   
   public class VisitorRihana extends Visitor
   {
       
      
      public function VisitorRihana()
      {
         super();
         addFrameScript(0,frame1,1,frame2,2,frame3);
         interestList = new Array("Other");
         MAX_MOOD = 100;
         MIN_MOOD = 26;
         pattiene = 20;
         ACCEL_MOOD = 0.5;
         speedX = 2;
         specialVisitor = true;
         visitorName = "Rohana";
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
