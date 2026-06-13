package
{
   import flash.events.Event;
   
   public class VisitorPunk extends Visitor
   {
       
      
      public function VisitorPunk()
      {
         super();
         addFrameScript(0,frame1,1,frame2,2,frame3);
         interestList = new Array("btnGameCenter","btnGameCenter","btnGameCenter","btnBurger","btnBurger","btnBurger","btnIceCream","btnIceCream","btnIceCream","Other");
         MAX_MOOD = 100;
         MIN_MOOD = 0;
         pattiene = 5;
         ACCEL_MOOD = 2.5;
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
