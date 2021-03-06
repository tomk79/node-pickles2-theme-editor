/**
 * postMessenger.js
 * iframeに展開されるプレビューHTMLとの通信を仲介します。
 */

module.exports = function(px2ce, iframe){
	var $ = require('jquery');

	var __dirname = px2ce.__dirname;
	// console.log(__dirname);
	var callbackMemory = {};

	function createUUID(){
		return "uuid-"+((new Date).getTime().toString(16)+Math.floor(1E7*Math.random()).toString(16));
	}
	function getTargetOrigin(iframe){
		if(window.location.origin=='file://'){
			return '*';
		}

		var url = $(iframe).attr('src');
		// console.log(url);
		var parser = document.createElement('a');
		parser.href=url;
		// console.log(parser);
		return parser.protocol+'//'+parser.host
	}

	/**
	 * 初期化
	 */
	this.init = function(callback){
		console.info('postMessenger.init() called');

		var targetWindowOrigin = getTargetOrigin(iframe);
		// console.log(targetWindowOrigin);

		var win = $(iframe).get(0).contentWindow;
		$.ajax({
			"url": __dirname+'/pickles2-preview-contents.js',
			// "url": __dirname+'/libs/broccoli-html-editor/client/dist/broccoli-preview-contents.js',
			// "dataType": "text/plain",
			"complete": function(XMLHttpRequest, textStatus){
				// console.log(XMLHttpRequest, textStatus);
				// console.log(XMLHttpRequest.responseText);
				var base64 = new Buffer(XMLHttpRequest.responseText).toString('base64');
				// console.log(base64);
				// console.log(__dirname+'/broccoli-preview-contents.js');
				win.postMessage({'scriptUrl':'data:text/javascript;charset=utf8;base64,'+base64}, targetWindowOrigin);
				callback();
			}
		});
		return this;
	}

	/**
	 * メッセージを送る
	 */
	this.send = function(api, options, callback){
		callback = callback||function(){};

		var callbackId = createUUID();
		// console.log(callbackId);

		callbackMemory[callbackId] = callback;

		var message = {
			'api': api,
			'callback': callbackId,
			'options': options
		};
		// console.log(callbackMemory);

		var win = $(iframe).get(0).contentWindow;
		var targetWindowOrigin = getTargetOrigin(iframe);
		win.postMessage(message, targetWindowOrigin);

		// callback();//TODO: 仮実装。本当は、iframe側からコールバックされる。
		return this;
	}

	/**
	 * メッセージを受信する
	 */
	window.addEventListener('message',function(event){
		var data=event.data;
		// console.log(event);
		// console.log(callbackMemory);

		if(data.api == 'onClickContentsLink'){
			// console.log(event.data.options);
			var data = event.data.options;
			px2ce.onClickContentsLink(data.url, data);
			return;

		}else{
			if(!callbackMemory[data.api]){return;}
			callbackMemory[data.api](data.options);
			callbackMemory[data.api] = undefined;
			delete callbackMemory[data.api];
		}
		return;

	});

	return;
}
