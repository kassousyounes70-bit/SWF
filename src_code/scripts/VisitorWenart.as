package
{
   import flash.events.Event;
   
   public class VisitorWenart extends Visitor
   {
       
      
      public function VisitorWenart()
      {
         super();
         addFrameScript(0,frame1,1,frame2,2,frame3);
         interestList = new Array("btnGameCenter","btnGameCenter","btnGameCenter","btnGameCenter","btnToyStore","btnToyStore","btnToyStore","btnToyStore","btnCafe","Other");
         MAX_MOOD = 100;
         MIN_MOOD = 0;
         pattiene = 15;
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
