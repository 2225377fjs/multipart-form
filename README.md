//����һ����box�����ϴ��ļ������ӣ������Ͼ��ܿ�����÷��ˡ�����


var ML = require('multipart-form');


var options = {
	host: 'api.box.com',
	port: 443,
	path: '/2.0/files/data ',
	method: 'POST',
	headers : {
		'authorization' : 'BoxAuth api_key=7x0m5fsxus1l0vfubmvj6phlnuifmcpu&auth_token=****'
	}
};


var ml = ML.MultiPart(options, true);
ml.add('folder_id', 0);
ml.addByFilePath('file2', 'aa.txt', 'aa.txt');
ml.addByFilePath('file1', 'bb.txt', 'bb.txt');
ml.post(function(err){
	console.log(err);
}, function(data){
	console.log(data)
});
