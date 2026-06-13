package
{
   import flash.events.Event;
   
   public class VisitorMacho extends Visitor
   {
       
      
      public function VisitorMacho()
      {
         super();
         addFrameScript(0,frame1,1,frame2,2,frame3);
         interestList = new Array("btnSushi","btnSushi","btnGameCenter","btnBurger","Other");
         MAX_MOOD = 75;
         MIN_MOOD = 0;
         pattiene = 10;
         ACCEL_MOOD = 2;
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
