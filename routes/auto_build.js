var fs = require('fs');
var buf = new Buffer(1024*1024);

var AutoBuild = {
}
AutoBuild.rumCommand = (cmd, args, callback) => {
  var spawn = require('child_process').spawn;
  var child = spawn(cmd, args);
  var response = ''
  child.stdout.on('data', buffer => (data) => {
  	console.log(data.toString());
  })
  child.on('exit', (code) => {
  	console.log("部署到github上成功");
  	//默认上传成功
  });
}
AutoBuild.doRum = function(callback){
	AutoBuild.rumCommand('cmd.exe', ['/c','auto_build.sh'], txt => {
      console.log(txt);
      if(callback){
      	callback.success(txt);
      }
	})
}
AutoBuild.createFile = function(buildData,callback){
	//生成文件
	fs.writeFile("../diglore/source/_posts/"+buildData.title+".md", buildData.content, function(){
		console.log("生成本地文件成功");
		//将生成的文件动态部署到github
        AutoBuild.doRum(callback);
    });
}

module.exports  = AutoBuild;
