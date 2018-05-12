var WebSocketClient = require('websocket').client;
var request = require('request');

var client = new WebSocketClient();

client.on('connectFailed', function(error) {
	console.log('Connect Erroe: ' + error.toString());
});

client.on('connect', function(connection) {
	connection.on('error', function(error) {
		console.log('Connection error: ' + error.toString());
	});

	connection.on('close', function() {
		console.log('close');
	});

	var header = null;
	connection.on('message', function(message) {
		var strMsg = JSON.stringify(message.utf8Data);

		try {
			objMsg = JSON.parse(strMsg.substring(strMsg.indexOf('{'), strMsg.lastIndexOf('}') + 1).replace(/\\+\"/g, '\"').replace(/\\+(u\w{4})/g, '\\$1'));
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
			console.log(objMsg.data.message);
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
