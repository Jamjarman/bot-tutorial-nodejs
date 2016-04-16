var HTTPS = require('https');
var cool = require('cool-ascii-faces');

var botID = process.env.BOT_ID;
var name = process.env.name;
var help="Usage: \n/"+name+" introduces all commands\nbuild directory will use git to pull and then restart pm2 for the specified directory\nls directory will return the contents of the given directories\ncat file will return the contents of the spcified files\nhelp will display this mneu";

function respond() {
    console.log(name);
    var request = JSON.parse(this.req.chunks[0]);
    //console.log(request);
    //console.log(request.text);
    //console.log(request.sender_id);
    var botRgx=new RegExp("^^/"+name);
    //if message matches bots command string parse it
    if(request.text && botRgx.test(request.text)){
	console.log("Checking query");
	var input=request.text;
	console.log(input);
	var comB=input.indexOf(" ");
	var comBE=input.indexOf(" ", comB+1);
	if(comBE<0)
	    comBE=input.length;
	console.log("comB "+comB+", comBE "+comBE);
	//get the command as the first string after the directive
	var com=input.substring(comB+1, comBE);
	console.log(com);
	input=input.substring(comBE+1);
	console.log(input);
	var argsL=[];
	//iterate over the rest of the string to get any arguments
	while(input.indexOf(" ")>=0){
	    var argT=input.substring(0, input.indexOf(" ")+1);
	    console.log(argT);
	    argsL.push(argT);
	    input=input.substring(input.indexOf(" ")+1);
	    console.log(input);
	}
	if(input.length>0){
	    argsL.push(input);
	}
	console.log(argsL);
	try{
	    if(com=="help"){
		postMessage(help);
	    }
	    else if(com=="ls"){
		var lsOut=new run_cmd([com], [argsL]);
	    }
	    else if(com=="cat"){
		var catOut=new run_cmd([com], [argsL]);
	    }
	    else if(com=="build"){
		var exec = require('child_process').exec;
		console.log(argsL[0]);
		exec('git pull origin master', {cwd: argsL[0].trim()}, (error, stdout, stderr) => {
		    if(error){
			throw error;
		    }
		    postMessage(stdout);
		});
		if(argsL[1] && argsL[1]=="node"){
		    exec('npm install', {cwd: argsL[0].trim()}, (error, stdout, stderr) => {
			if(error)
			    console.log(error);
			postMessage(stdout);
		    });
		}
		exec('grep "main" package.json', {cwd: argsL[0].trim()}, (error, stdout, stderr) => {
		    console.log("Getting main file");
		    if(error)
			throw error;
		    var spaceLoc=stdout.indexOf(" ", 5);
		    var endLoc=stdout.indexOf("\"", spaceLoc+2);
		    console.log(stdout+" "+spaceLoc+" "+endLoc);
		    var mainfile=stdout.substring(spaceLoc+2, endLoc);
		    console.log(mainfile);
		    exec('pm2 restart '+mainfile, {cwd: argsL[0].trim()}, (error, stdout, stderr) => {
			if(error)
			    throw error;
			postMessage(stdout);
		    });
		});
		
		
	    }
	    else{
		console.log("Command not found");
		postMessage(help);
	    }
	}
	catch(err){
	    console.log(err);
	    postMessage(help);
	}
    }
    //postMessage();
}

function run_cmd(comd, args){
    for(var i=0; i<comd.length; i++){
	var spawn=require('child_process').spawn, child=spawn(comd[i], args[i]), me=this;
	
	child.stdout.on('data', function(buffer){
	    me.stdout += buffer.toString();
	});
	child.stdout.on('end', function(){
	    postMessage(me.stdout.substring(9));
	});
    }
    
}
    

function postMessage(botResponse) {
  var options, body, botReq;

   options = {
    hostname: 'api.groupme.com',
    path: '/v3/bots/post',
    method: 'POST'
  };

  body = {
    "bot_id" : botID,
    "text" : botResponse
  };

  console.log('sending ' + botResponse + ' to ' + botID);

  botReq = HTTPS.request(options, function(res) {
      if(res.statusCode == 202) {
        //neat
      } else {
        console.log('rejecting bad status code ' + res.statusCode);
      }
  });

  botReq.on('error', function(err) {
    console.log('error posting message '  + JSON.stringify(err));
  });
  botReq.on('timeout', function(err) {
    console.log('timeout posting message '  + JSON.stringify(err));
  });
  botReq.end(JSON.stringify(body));
}


exports.respond = respond;
