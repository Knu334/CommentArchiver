var WebSocketClient = require('websocket').client;
var request = require('request');
var fs = require('fs');

var client = new WebSocketClient();

client.on('connectFailed', function(error) {
	console.log('Connect Erroe: ' + error.toString());
});

client.on('connect', function(connection) {
	var header = null;
	var currentIndex = 0;
	var startTime = new Date();
	var tempArray = new Array();
	var commentArray = new Array();
	var interval = null;

	connection.on('error', function(error) {
		if (interval != null) {
			clearInterval(interval);
		}
		console.log('Connection error: ' + error.toString());
	});

	connection.on('close', function() {
		if (interval != null) {
			clearInterval(interval);
		}
		fs.writeFileSync('comment.json', JSON.stringify(commentArray));
		console.log('close');
	});

	connection.on('message', function(message) {
		var strMsg = JSON.stringify(message.utf8Data);

		try {
			objMsg = JSON.parse(strMsg.substring(strMsg.indexOf('{'), strMsg.lastIndexOf('}') + 1)
						.replace(/\\+\"/g, '\"')
						.replace(/\\+(u\w{4})/g, '\\$1'));
		} catch(e) {
			objMsg = {};
		}

		if (header == null) {
			header = objMsg;
			interval = setInterval(function() {
				connection.sendUTF('2')
			}, header.pingInterval);
			return;
		}

		if (objMsg.type == 0 && objMsg.data.stamp == null) {
			var currentTime = new Date();
			var gapTime = (currentTime.getTime() - startTime.getTime()) / 1000;
			var element = [objMsg.data.message, gapTime];
			for ( ; currentIndex < Math.floor(gapTime); currentIndex++) {
				commentArray[currentIndex] = tempArray;
				tempArray = new Array();
			}
			tempArray.push(element);
			//console.log(JSON.stringify(commentArray));
		}
	});
});

var options = {
	url: '',
	headers: {
        	'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.139 Safari/537.36'
	}
}

request.get(options, function (error, response, body) {
	var hls_url = body.match(/https?:\/\/.+?openrec.tv.+?\.m3u8/)[0];
	var wss_url = 'wss://chat.openrec.tv/socket.io/?movieId=' + body.match(/gbl_movie_id\s*=\s*(\d+)/)[1] + '&EIO=3&transport=websocket';
	client.connect(wss_url);
});
