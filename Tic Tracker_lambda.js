  // 1. Text strings =====================================================================================================
  //    Modify these strings and messages to change the behavior of your Lambda function

  const languageStrings = {
      'en': {
          'translation': {
              'WELCOME' : "Welcome to tic tracker. ",
              'TITLE'   : "Tic Tracker",
              'HELP'    : "This skill keeps track of all your general grocery items. Just give me details of item you are taking on monthly subscription.",
              'STOP'    : "goodbye.",
              'VERSION' : "Version: 1.00v"
          }
      }
      // , 'de-DE': { 'translation' : { 'WELCOME'   : "Guten Tag etc." } }
  };
 const data = {
    // TODO: Replace this data with your own.
      "Welcome" :
      [
          '<say-as interpret-as="interjection">Hello</say-as>.',
          '<say-as interpret-as="interjection">Howdy</say-as>.',
          '<say-as interpret-as="interjection">Welcome Back</say-as>.',
          '<say-as interpret-as="interjection">Good day</say-as>.',
          '<say-as interpret-as="interjection">Glad to see you again</say-as>.'
          ],
      "wmsg" :
      [
          'Hello. ',
          'Howdy. ',
          'Welcome Back. ',
          'Good day. ',
          'Glad to see you again. '
          ]
  };

  const welcomeCardImg = {
      smallImageUrl: '',
      largeImageUrl: ''
  };
  // 2. Skill Code =======================================================================================================

  const Alexa = require('alexa-sdk');
  const AWS = require('aws-sdk');  // this is defined to enable a DynamoDB connection from local testing
  const AWSregion = 'us-east-1';   // eu-west-1
  var persistenceEnabled;
  AWS.config.update({
      region: AWSregion
  });

  exports.handler = function(event, context, callback) {
      var alexa = Alexa.handler(event, context);
      // alexa.appId = 'amzn1.echo-sdk-ams.app.1234';
      alexa.dynamoDBTableName = 'tic_tracker'; // creates new table for session.attributes
      if (alexa.dynamoDBTableName == 'tic_tracker' ){
        persistenceEnabled=true;
      } else {
        persistenceEnabled=false;
      }
      alexa.resources = languageStrings;
      alexa.registerHandlers(handlers);
      alexa.execute();

  };
  
  var today = new Date();

  var say ="",reSay ="", property = "", display = "";
  var status, r, price = 0, ns, invoke;
  
  var item="", quantity=0,pitem="",titem="",qitem="";
  
  var date = today.getDate();
  var lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  
  const handlers = {
      'LaunchRequest': function () {
        
        //check = 0;
        item = "";
        quantity =0;
        status=0;
        ns=0;
        invoke=0;
            
          if (!this.attributes['firstUser'] ) {
              
              this.attributes['firstUser']=1;
              status = 1;
              ns = 1;
              
              this.attributes['cd']=1;
              
              say = this.t('WELCOME') + ' ' + this.t('HELP');
              reSay = " Would you like to continue?";

              this.response.cardRenderer(this.t('TITLE'), this.t('WELCOME') +"\n" + this.t('HELP'), welcomeCardImg);
          } 
          
          else {
            
            r= randomSelect(5);
            
            if(date == lastDay){
              this.attributes['cd']=0;
              status = 4;
              ns = 4;
              say = "Today is the last day of this month.";
              reSay =" Would you like to know your final bill?";
              display = say + "\n\n" + reSay;
            }
            else{
            say = data.Welcome[r];
            reSay = " Please tell me what to add? or ask me for skill menu?";
            display = data.wmsg[r] + "\n" + reSay;
            }
            //this.response.cardRenderer(this.t('TITLE'), );
            this.response.cardRenderer(this.t('TITLE'), display, welcomeCardImg);
          }
          
          this.response.speak(say+reSay).listen(reSay);
          this.emit(':responseReady');
      },
      
      'SkillMenuIntent': function(){
        say =" 1. Add new items. 2. Ask me your milk bill for this month. 3. Ask me to Change the price of the item into your list. 4. Ask me your last month bills. 5. To know more about this skill ask for help. ";
        reSay =" What would you like to do?";
        this.response.speak(say+reSay).listen(reSay);
        this.emit(':responseReady');
      },
      
      'AddNewItemIntent': function(){
        
        say = "Here are the list of items that you can add. 1. Milk. 2. Water. 3. Newspaper. What would you like to add?";
        
        this.response.speak(say).listen("Please tell me what would you like to add.");
        this.emit(':responseReady');
      },
      
      'AddItemIntent' : function (){
        
        item = this.event.request.intent.slots.item.value;
        r= randomSelect(2);
        
        if(this.attributes[item]==1){
          say = "This item already exists in your list. ";
          reSay = "Please tell me a new item name ?";
        }
        else{
          
          if(r==1){
          this.attributes[item]=1;
          
          property = CheckProperty(item);
          
          say = "Item added successfully. ";
          
          reSay = " Please tell me the price of one " + property + " of "+ item + " ?";
          
          }
          else{
            say = "Hmmm. ";
            reSay = " Are you sure about adding this item ?";
            status=2;
            ns=2;
          }
        }
        this.response.speak(say + reSay).listen(reSay);
        this.emit(':responseReady');
      },
      
      'PriceIntent': function(){
        price = this.event.request.intent.slots.price.value;
        
        pitem = "p"+item;
        this.attributes[pitem]=price;
        
        say = "Price added successfully. I'm done setting up your new item in the list. Next time just ask me to add a "+property+" of "+ item +" in your daily list.";
        
        this.response.speak(say + " Goodbye.");
        this.emit(':responseReady');
      },
      
      'SureAddIntent': function(){
        
        this.attributes[item]=1;
        
        property = CheckProperty(item);
        
        say = "Item Added Successfully. ";
        reSay = "Please tell me the price of one " + property + " of "+ item + ".";
        
        this.response.speak(say + reSay).listen(reSay);
        this.emit(':responseReady');
      },
      
      'AddInTodayList': function(){
        quantity = this.event.request.intent.slots.quantity.value;
        
        item = this.event.request.intent.slots.item.value;
        
        if(date == 1 && this.attributes['cd'] == 0 && invoke == 0){
          this.attributes['cd'] = 1;
          invoke = 1; 
          
    if(this.attributes['milk']==1){
    this.attributes['qmilk']=0;
    this.attributes['tmilk']=0;
    }
    
    if(this.attributes['newspaper']==1){
    this.attributes['qnewspaper']=0;
    this.attributes['tnewspaper']=0;
    }
    
    if(this.attributes['water']==1){
    this.attributes['qwater']=0;
    this.attributes['twater']=0;
    }
        }
        else if(date == 1 && this.attributes['cd']==1 && invoke == 0){
          invoke = 1;
           say ="Here is your last monthly bill.";
        
        if(this.attributes['milk']==1){
          say += " For Milk. ";
          
          if(this.attributes['qmilk'] == undefined)
          this.attributes['qmilk']=0;
          
          quantity = this.attributes['qmilk'];
          price = this.attributes['pmilk'];
          var total_milk = quantity * price;
          say += " In this month you have purchased total of "+quantity+" litres of milk at rate of "+price+" per litre. Your total bill amount is "+total_milk+".";
        }
        if(this.attributes['water']==1){
          say += " For Water. ";
          
          if(this.attributes['qwater'] == undefined)
          this.attributes['qwater']=0;
          
          quantity = this.attributes['qwater'];
          price = this.attributes['pwater'];
          var total_water = quantity * price;
          say += " In this month you have purchased total of "+quantity+" litres of water at rate of "+price+" per litre. Your total bill amount is "+total_water+".";
        
        }
        if(this.attributes['newspaper']==1){
          say += " For Newspaper. ";
          
          if(this.attributes['qnewspaper']==undefined)
          this.attributes['qnewspaper']=0;
          
          quantity = this.attributes['qnewspaper'];
          price = this.attributes['pnewspaper'];
          var total_newspaper = quantity * price;
          say += " In this month you have purchased total of "+quantity+" pieces of newspaper at rate of "+price+" per piece. Your total bill amount is "+total_newspaper+".";
        }
          this.attributes['oldbill']=say;
          
          if(this.attributes['milk']==1){
          this.attributes['qmilk']=0;
          this.attributes['tmilk']=0;
        }
    
          if(this.attributes['newspaper']==1){
          this.attributes['qnewspaper']=0;
          this.attributes['tnewspaper']=0;
        }
    
          if(this.attributes['water']==1){
          this.attributes['qwater']=0;
          this.attributes['twater']=0;
        }
        }
        else if(date !=1 && invoke == 0){
          invoke=1;
        }
        
        if(quantity == undefined){
          quantity = 1;
        }

        if(!this.attributes[item]){
          
          status = 3;
          ns = 3;
          
          say = "This item doesnot exists in your list.";
          reSay = " Would you like to add it?";
          this.response.speak(say+reSay).listen(reSay);
        }
        else{
          titem = "t"+item;
          pitem = "p"+item;
          qitem = "q"+item;
          if(!this.attributes[titem]){
            this.attributes[titem]=quantity*this.attributes[pitem];
          }
          else{
          var total = this.attributes[titem];
          this.attributes[titem]=total+quantity*this.attributes[pitem];
          }
          
          if(!this.attributes[qitem]){
            this.attributes[qitem]=Number(quantity);
          }
          else{
            var total_quantity = this.attributes[qitem];
            this.attributes[qitem]=Number(total_quantity)+Number(quantity);
          }
          
          say = "Item added Successfully to your todays list.";
          
          this.response.speak(say);
        }
        
        this.emit(':responseReady');
      },
      
     'UpdatePriceIntent' : function(){
        var price = this.event.request.intent.slots.price.value;
        var item = this.event.request.intent.slots.item.value;
        
        if(price == undefined)
        {
          say = "please tell me new price with the item name?";
          this.response.speak(say).listen(say);
        }
        else if(item == undefined){
          say = "Please tell me the item name as well as it's new price?";
          this.response.speak(say).listen(say);
        }
        else{
          pitem = "p"+item;
          this.attributes[pitem] = price;
          
          say = "Price of "+item+" is changed successfully.";
          this.response.speak(say);
        }
        this.emit(':responseReady');
      },
      
      'ChangeThePrice': function(){
        say = "Please tell me the item name with it's new price. or ask me to change the price of any item to it's new price?";
        this.response.speak(say).listen(say);
        this.emit(':responseReady');
      },
      
      'BillIntent': function(){
        var item = this.event.request.intent.slots.item.value;
        
        if(item == undefined){
        
        say ="Here is your monthly bill.";
        
        if(this.attributes['milk']==1){
          say += " For Milk. ";
          
          if(this.attributes['qmilk']==undefined)
          this.attributes['qmilk']=0;
          
          quantity = this.attributes['qmilk'];
          price = this.attributes['pmilk'];
          var total_milk = quantity * price;
          say += " In this month you have purchased total of "+quantity+" litres of milk at rate of "+price+" per litre. Your total bill amount is "+total_milk+".";
        }
        if(this.attributes['water']==1){
          say += " For Water. ";
          
          if(this.attributes['qwater']==undefined)
          this.attributes['qwater']=0;
          
          quantity = this.attributes['qwater'];
          price = this.attributes['pwater'];
          var total_water = quantity * price;
          say += " In this month you have purchased total of "+quantity+" litres of water at rate of "+price+" per litre. Your total bill amount is "+total_water+".";
        
        }
        if(this.attributes['newspaper']==1){
          say += " For Newspaper. ";
          
          if(this.attributes['qnewspaper']==undefined)
          this.attributes['qnewspaper']=0;
          
          quantity = this.attributes['qnewspaper'];
          price = this.attributes['pnewspaper'];
          var total_newspaper = quantity * price;
          say += " In this month you have purchased total of "+quantity+" pieces of newspaper at rate of "+price+" per piece. Your total bill amount is "+total_newspaper+".";
        }
        this.attributes['oldbill']="For last month, "+say;
        }
        else{
        if(this.attributes[item]==1){
          say = " For "+item+".";
          
          qitem = "q"+item;
          pitem = "p"+item;
          
          if(this.attributes[qitem]==undefined)
          this.attributes[qitem]=0;
          
          quantity = this.attributes[qitem];
          price = this.attributes[pitem];
          var total_item = quantity * price;
          property = CheckProperty(item);
          
          say += " In this month you have purchased total of "+quantity+" "+property+" of "+item+" at rate of "+price+" per "+property+". Your total bill amount is "+total_item+".";
        }
        else{
          say = "I'm sorry but You have not purchased "+item+". This month.";
        }
        }
        
        this.response.speak(say);
        this.emit(':responseReady');
      },
      
      'ItemBillIntent': function () {
        say = "To know your bill you can ask me. show bill for milk or newspaper or any other item or you can directly ask me for last month bills.";
        reSay =" What would you like to do?";
        this.response.speak(say+reSay).listen(say);
        this.emit(':responseReady');
      },
      
      'LastMonthBill': function(){
        if(!this.attributes['oldbill']){
          say = "You don't have any record for last month.";
        }
        else{
          say = this.attributes['oldbill'];
        }
        
        this.response.speak(say);
        this.emit(':responseReady');
      },
      
      'ClearDataIntent': function(){
        say = "This action will delete all your data for the current month.";
        reSay = " Are You sure?";
        
        status = 6;
        ns = 6;
        
        this.response.speak(say+reSay).listen(reSay);
        this.emit(':responseReady');
      },
      
      'ClearDataYes': function(){
        say ="Here is your last monthly bill.";
        
        if(this.attributes['milk']==1){
          say += " For Milk. ";
          
          quantity = this.attributes['qmilk'];
          price = this.attributes['pmilk'];
          var total_milk = quantity * price;
          say += " In this month you have purchased total of "+quantity+" litres of milk at rate of "+price+" per litre. Your total bill amount is "+total_milk+".";
        }
        if(this.attributes['water']==1){
          say += " For Water. ";
          
          quantity = this.attributes['qwater'];
          price = this.attributes['pwater'];
          var total_water = quantity * price;
          say += " In this month you have purchased total of "+quantity+" litres of water at rate of "+price+" per litre. Your total bill amount is "+total_water+".";
        
        }
        if(this.attributes['newspaper']==1){
          say += " For Newspaper. ";
          
          quantity = this.attributes['qnewspaper'];
          price = this.attributes['pnewspaper'];
          var total_newspaper = quantity * price;
          say += " In this month you have purchased total of "+quantity+" pieces of newspaper at rate of "+price+" per piece. Your total bill amount is "+total_newspaper+".";
        }
          this.attributes['oldbill']=say;
          
          if(this.attributes['milk']==1){
          this.attributes['qmilk']=0;
          this.attributes['tmilk']=0;
        }
    
          if(this.attributes['newspaper']==1){
          this.attributes['qnewspaper']=0;
          this.attributes['tnewspaper']=0;
        }
    
          if(this.attributes['water']==1){
          this.attributes['qwater']=0;
          this.attributes['twater']=0;
        }
        say = "Data Cleared Successfully";
        this.response.speak(say);
        this.emit(':responseReady');
      },
        
      'AMAZON.YesIntent': function() {
          if(status==1)
          this.emit('AddNewItemIntent');
          else if(status == 2)
          this.emit('SureAddIntent');
          else if(status == 3)
          this.emit('AddNewItemIntent');
          else if(status == 4)
          this.emit('ItemBillIntent');
          else if(status == 5)
          this.emit('AddNewItemIntent');
          else if(status == 6)
          this.emit('ClearDataYes');
      },
      
      'AMAZON.NoIntent': function () {
        if(ns == 1){
          this.response.speak('Okay, goodbye. see you next time!');
        }
        else if(ns == 2){
          this.response.speak("Please tell me the name of new item ?").listen("Please tell me a new item name ?");
        }
        else if(ns == 3){
          this.response.speak('Okay, goodbye. see you next time!');
        }
        else if(ns == 4){
          this.response.speak("Hmmm. That's ok, you can ask me to add new item? or ask me for skill menu?").listen("Please tell me what to add? or ask me for skill menu?");
        }
        else if(ns == 5){
          this.response.speak("Hmmm. That's ok, you can ask me to add new item? or ask me for skill menu?").listen("Please tell me what to add? or ask me for skill menu?");
        }
        else if(ns == 6){
          this.response.speak("Hmmm. That's ok, you can ask me to add new item? or ask me for skill menu?").listen("Please tell me what to add? or ask me for skill menu?");
        }
        this.emit(':responseReady');
      },
      
      'AMAZON.HelpIntent': function () {
        status = 5;
        ns = 5;
        
        say = "Welcome to tic tracker. This skill is designed to keep track of the items that you purchase on monthly subscription. For example, milk, water, newspaper."+
        " Here in this skill you are also asked about the price of the unit of the item, which helps in generation of the bill whenever asked or at the end of the month."+
        " The skill further contains dynamic response according to the date, specifically at the last day of the month you will be asked to know your bill for different items."+
        " Sharing more and more information about the items into your list might help you with different use cases of this skill.";
        
        reSay=" Would you like to continue?";
          
          this.response.speak(say + reSay).listen(reSay);
          this.emit(':responseReady');
      },
      
      'AMAZON.CancelIntent': function () {
          this.response.speak(this.t('STOP'));
          this.emit(':responseReady');
      },
      
      'AMAZON.StopIntent': function () {
        this.attributes['firstUser']=1;
        this.emit('SessionEndedRequest');
      },
      
      'SessionEndedRequest': function () {
          console.log('session ended!');
          this.response.speak('<say-as interpret-as="interjection">bye bye</say-as>');
          this.emit(':responseReady');
      }
  };

  //    END of Intent Handlers {} ========================================================================================
  // 3. Helper Function  =================================================================================================
  
  function randomSelect(i){
    return (Math.floor(Math.random()*i));
  }
  
  function CheckProperty(item){
    
          if(item == "milk" || item == "water"){
            return  " litre ";
          }
          else if(item == "newspaper"){
            return " piece";
          }
          else {
            return " Kilogram ";
          }
  }

  