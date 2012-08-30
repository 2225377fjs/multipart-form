var fs = require('fs');
var http = require('http');
var https = require('https');
var boundaryKey = '------------------------------970e3eaff5a3';

//构造函数
function ML(option, isHttps) {
	this.options = option, this.isHttps = isHttps, this.list = [];
}
var pro = ML.prototype;


//增加数据项，name表示该项的名字，value对应该项的具体数据，filename表示上传文件的名字，type对应请求的content-type（对于非上传文件，filename与type可选）
pro.add = function (name, value, filename, type) {
	var temp = {};
	temp.name = name, temp.value = value, temp.filename = filename, temp.type = type;
	this.list.push(temp);
}

//用文件的路径来代替具体的数据，用stream的方式来上传，对于大文件比较好（type可选）
pro.addByFilePath = function (name, filePath, filename, type) {
	var temp = {};
	temp.name = name, temp.filePath = filePath, temp.filename = filename, temp.type = type;
	this.list.push(temp);
}

pro.post = function(errorCallback, dataCallback) {
	
	var str = '--' + boundaryKey + '\r\n';
	var tsize = 0;
	
	//计算content-length
	for (var i = 0 ; i < this.list.length; i++) {
		var item = this.list[i];
		if (item.filename) {
			if (item.type){
				str += 'Content-Disposition: form-data; name="'+item.name+'"; filename="'+ item.filename +'"\r\n';
				str += 'Content-Type: '+item.type+'\r\n\r\n'; 
			} else {
				str += 'Content-Disposition: form-data; name="'+item.name+'"; filename="'+ item.filename +'"\r\n\r\n';
			}
			if (item.filePath) {
				tsize += fs.statSync(item.filePath).size;
			} else {
				str += item.value;
			}
		}  else {
			str += 'Content-Disposition: form-data; name="'+item.name+'"\r\n\r\n';
			str += item.value;
		}
		if (i == (this.list.length - 1)) {
			str += '\r\n--' + boundaryKey + '--';
		} else {
			str += '\r\n--' + boundaryKey + '\r\n';
		}
	}
	var size = Buffer.byteLength(str) + tsize ;
	//console.log('size: ' + size);
	delete str;
	var req;
	function doRes(res) {
		var data = '';
		res.on('data', function(d) {
			data += d;
		});
		res.on('end', function(){
			dataCallback(data);
		});
	}
	
	if (this.isHttps) {
		req = https.request(this.options, doRes);
	} else {
		req = http.request(this.options, doRes);
	}
	req.on('error', errorCallback); 
	
	req.setHeader('Content-Type', 'multipart/form-data; boundary='+boundaryKey);
	
	req.setHeader('Content-length', size);
	
	req.write('--' + boundaryKey + '\r\n');
	
	var list = this.list;
	
	//向服务器post数据
	function doIt(number) {
		var item = list[number];
		if (item.filename) {
			if (item.type){
				req.write('Content-Disposition: form-data; name="'+item.name+'"; filename="'+ item.filename +'"\r\n');
				req.write('Content-Type: '+item.type+'\r\n\r\n'); 
			} else {
				req.write('Content-Disposition: form-data; name="'+item.name+'"; filename="'+ item.filename +'"\r\n\r\n');
			}
			if (item.filePath) {
				var stream = fs.createReadStream(item.filePath, { bufferSize: 4 * 1024 }).on('end', function(){
					if (number == (list.length - 1)) {
						console.log('over');
						req.write('\r\n--' + boundaryKey + '--');
					} else {
						req.write('\r\n--' + boundaryKey + '\r\n');
						doIt(number+1);
					}
					
				}).pipe(req, {end : false});
				return;
			} else {
				req.write(item.value);
			}
		} else {
			req.write('Content-Disposition: form-data; name="'+item.name+'"\r\n\r\n');
			req.write(item.value + '');
		}
		if (number == (list.length - 1)) {
			console.log('over');
			req.write('\r\n--' + boundaryKey + '--');
		} else {
			req.write('\r\n--' + boundaryKey + '\r\n');
			doIt(number+1);
		}
	}
	doIt(0);
	
}

exports.MultiPart = function(options, isHttps) {
	return new ML(options, isHttps);
}