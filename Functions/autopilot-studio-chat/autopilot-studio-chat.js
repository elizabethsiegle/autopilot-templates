var got = require('got');

exports.handler = function(context, event, callback) {
    
    // Takes the first message, creates the channel webhook
    console.log(event);

    let channelSid = event.channelSid;
    
    const client = context.getTwilioClient();
	const service = client.chat.services(context.TWILIO_CHAT_SERVICE_SID);
    
    // Pipe body to Autopilot
    let requestPayload = "user_id="+event.from+"&text="+event.text;

    got.post('https://channels.autopilot.twilio.com/v1/'+context.ACCOUNT_SID+'/'+context.TWILIO_AUTOPILOT_ASSISTANT_SID+'/custom/webchat', 
    { 
        headers: { 
            'content-type': 'application/x-www-form-urlencoded',
            'accept': 'application/json',
            'authorization' :  'Basic ' + new Buffer(context.ACCOUNT_SID+ ':' + context.AUTH_TOKEN).toString('base64')
        },
        body: requestPayload
    }).then(function(response) {
        
        // Pipe the Autopilot response to the chat channel
        let apResponse = JSON.parse(response.body);
        console.log(apResponse);
        console.log(apResponse.remember);
        console.log(apResponse.remember.memory);
        let memory = {};
        if (apResponse.remember.memory) { 
            memory = JSON.parse(apResponse.remember.memory);
            console.log("Parsed "+memory.handoff);
        }
        
        let saysArray = apResponse.says;
        let saysProcessed = 0;
        let responseMessage = "";
        let handoff = "";
        
        saysArray.forEach(function(value){
            responseMessage += " "+ value.speech;
        });
        
        // if handoff exit
        if (memory.handoff){
            console.log("send to Flex");
            
             service.channels(channelSid).messages.create({"body": responseMessage, "from": "Autopilot"})
            .then((response) => {
                console.log("Reponse:"+response);
                callback(null, {destination:"flex"});
            }).catch(error => { 
                console.log(error); 
                callback(error); });
        }
        
        console.log("send the message");
        
        service.channels(channelSid).messages.create({"body": responseMessage, "from": "Autopilot"})
            .then((response) => {
                console.log("Reponse:"+response);
                callback(null, {destination:"autopilot"});
            }).catch(error => { 
                console.log(error); 
                callback(error); });
        
    }).catch(function(error) {
        callback(error)
    });
  
};
