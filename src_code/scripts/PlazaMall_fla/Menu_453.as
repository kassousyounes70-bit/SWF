package PlazaMall_fla
{
   import flash.display.MovieClip;
   import flash.display.SimpleButton;
   import flash.events.KeyboardEvent;
   import flash.events.MouseEvent;
   import flash.text.TextField;
   import flash.ui.Keyboard;
   
   public dynamic class Menu_453 extends MovieClip
   {
       
      
      public var btnOK:SimpleButton;
      
      public var btnCancel:SimpleButton;
      
      public var nameInput:TextField;
      
      public function Menu_453()
      {
         super();
         addFrameScript(0,frame1);
      }
      
      public function btnCancelClicked(param1:MouseEvent) : void
      {
         cancelGame();
      }
      
      function frame1() : *
      {
         btnOK.addEventListener(MouseEvent.CLICK,btnOKClicked);
         btnCancel.addEventListener(MouseEvent.CLICK,btnCancelClicked);
         stage.addEventListener(KeyboardEvent.KEY_UP,KeyUpProgress);
      }
      
      public function playGame() : void
      {
         var _loc1_:* = undefined;
         var _loc2_:* = undefined;
         if(nameInput.text != "")
         {
            _loc1_ = this.parent;
            _loc2_ = _loc1_.parent;
            _loc2_.playerName = nameInput.text;
            this.visible = false;
            _loc1_.btnNewGame.visible = true;
            _loc1_.btnLoad.visible = true;
            _loc1_.btnBack.visible = true;
            stage.removeEventListener(KeyboardEvent.KEY_UP,KeyUpProgress);
            _loc1_.gotoAndPlay("Sub Play Out");
            _loc1_.subMenuPlay = 1;
         }
      }
      
      public function KeyUpProgress(param1:KeyboardEvent) : void
      {
         var _loc2_:* = undefined;
         _loc2_ = param1.keyCode;
         if(_loc2_ == Keyboard.ENTER)
         {
            playGame();
         }
         if(_loc2_ == Keyboard.ESCAPE)
         {
            cancelGame();
         }
      }
      
      public function cancelGame() : void
      {
         var _loc1_:* = undefined;
         var _loc2_:* = undefined;
         if(this.visible)
         {
            _loc1_ = this.parent;
            _loc1_.btnNewGame.visible = true;
            _loc1_.btnLoad.visible = true;
            _loc1_.btnBack.visible = true;
            _loc2_ = _loc1_.parent;
            _loc2_.playerName = nameInput.text;
            this.visible = false;
         }
      }
      
      public function btnOKClicked(param1:MouseEvent) : void
      {
         playGame();
      }
   }
}
