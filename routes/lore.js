'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var AS = require('api-send');
AS.config.APPID = '59156b13a0bb9f005fd3cb3a';
AS.config.HOST = 'http://magic-box.leanapp.cn';
var cheerio = require('cheerio');
var charset = require('superagent-charset');
var superagent = require('superagent');
var toMarkdown = require('to-markdown');
var AutoBuild = require('./auto_build.js');

function sendError(res,code,message){
	var result = {
		code:code,
		message:message,
		data:[]
	}
	res.send(result);
}

function validate(res,req,data){
	if(AS.config.APPID && !AS.add(req,data)){
		res.send('true');
		return;
	}
	for(var i in data){
		if(req.method == 'GET'){
			var value = req.query[i];
		}else{
			var value = req.body[i];
		}
		if(data[i]){
			//必须值
			if(!value){
				var result = {
					code : '302',
					message : '缺少'+data[i],
					data : []
				}
				res.send(result);
				return '';
			}
		}
		data[i] = value;
	}
	return data;
}

function formatDate(format, timestamp, full) {
    format = format.toLowerCase();
    if (!format) format = "y-m-d h:i:s";

    function zeroFull(str) {
        // console.log(full);
        // return full ? (str >= 10 ? str : ('0' + str)) : str;
        return (str >= 10 ? str : ('0' + str));
    }
    var time = new Date(timestamp),
        o = {
            y: time.getFullYear(),
            m: zeroFull(time.getMonth() + 1),
            d: zeroFull(time.getDate()),
            h: zeroFull(time.getHours()),
            i: zeroFull(time.getMinutes()),
            s: zeroFull(time.getSeconds())
        };
    return format.replace(/([a-z])(\1)*/ig, function(m) {
        return o[m];
    });
};

function fPaltform(url,result){
	var $ = cheerio.load(result.text);
	if(url.indexOf("jianshu.com") > 0 ){
		//简书平台的标题
		var title = $(".title").text();
		//简书平台的作者
		var author = $(".author .name").text();
		//当前时间
		var date = new Date();
		date = formatDate("y-m-d h:i:s",date);
		//简书平台的内容
		$(".image-caption").remove();
		var content = $(".show-content").append("<b>转自:</b><a href="+url+" target='_blank'>"+url+"</a>").html();
		content = "---\n"+
				  "title: "+title+"\n"+
				  "date: "+date+"\n"+
				  "tags: \n"+
				  "---\n"+
				  "\n"+toMarkdown(content);
		var data = {
			content  : content,
			title    : title,
			author   : author,
			platform : "简书" 
		}
		return data;
	}
}

function format(url,id){
	superagent.get(url)
	  .end((err, result) => {
		if(result.statusCode == 200){
				var markDownData = fPaltform(url,result);
				// console.log(markDownData);
				//更改content
				var editObj = AV.Object.createWithoutData('Lore', id);
				editObj.set("content",markDownData.content);
				editObj.set("platform",markDownData.platform);
				editObj.set("title",markDownData.title);
				editObj.save();
			}else{
				res.send(err);
			}
		});
}


var Lore = AV.Object.extend('Lore');

// 新增
router.post('/add', function(req, res, next) {
	var data = {
		url      : "链接",
		user_id  : "用户id",
		content  : "",
		title    : "",
		platform : "",
  }
	var data = validate(res,req,data);
	if(!data){
		return;
	}
	var query = new AV.Query(Lore);
	query.equalTo('url',data.url);
	query.equalTo('user_id',data.user_id);
	query.find().then(function(results) {
		//判断是否存在
		if(results.length){
			//存在
			var result = {
		   		code : 601,
		    	message : '已存在'
			}
			res.send(result);
		}else{
			//不存在
			//创建应用
			var addObj = new Lore();
			for(var key in data){
				addObj.set(key,data[key]);
			}
			addObj.save().then(function (addResult) {
				console.log(addResult.id);
		    	var result = {
		    		code : 200,
		    		data : addResult,
		    		message : '保存成功'
		    	}
					res.send(result);
					format(addResult.attributes.url,addResult.id);
			}, function (error) {
		    	var result = {
		    		code : 500,
		    		message : '保存出错'
		    	}
		    	res.send(result);
			});
		}
	}, function(err) {
		if (err.code === 101) {
			res.send(err);
  	} else {
      	next(err);
    }
	}).catch(next);
})

// 删除
router.get('/delete', function(req, res, next) {
	var data = {
		id  : 'id'
  }
	var data = validate(res,req,data);
	if(!data){
		return;
	}
	var delObj = AV.Object.createWithoutData('Lore', data.id);
	delObj.destroy().then(function (success) {
		// 删除成功
		var result = {
		   	code : 200,
		   	data : [],
		    message : '项目已存在'
		}
		res.send(result);
	}, function(error) {
		res.send(error);
	}).catch(next);
})

// 编辑
router.post('/edit', function(req, res, next) {
	var data = {
		id  : 'id'
  }
	var data = validate(res,req,data);
	if(!data){
		return;
	}
	var editObj = AV.Object.createWithoutData('Lore', data.id);
	for(var key in req.body){
		editObj.set(key,req.body[key]);
	}
	editObj.save().then(function (editResult) {
		var result = {
		    code : 200,
		    data : editResult,
		    message : 'success'
		}
		res.send(result);
	}, function (error) {
		var result = {
		    code : 500,
		    message : '保存出错'
		}
		res.send(result);
	}).catch(next);
})

// 查找
router.get('/list', function(req, res, next) {
	var data = {
			limit : '',
      skip  : ''
  }
	var data = validate(res,req,data);
	if(!data){
		return;
	}
	var limit = data.limit ? data.limit : 1000;
	var skip  = data.skip ? data.skip : 0;
	var query = new AV.Query('Lore');
	query.skip(skip);
	query.limit(limit);
	query.find().then(function (results) {
		// 删除成功
		var result = {
		   	code : 200,
		   	data : results,
		    message : '获取成功'
		}
		res.send(result);
	}, function(error) {
		res.send(error);
	}).catch(next);
})

// 查找
router.get('/deploy', function(req, res, next) {
	var data = {
		id  : 'id'
  }
	var data = validate(res,req,data);
	if(!data){
		return;
	}
	var query = new AV.Query('Lore');
	query.get(data.id).then(function(results){
		// 删除成功
		if(results){
			var data = results.attributes;
			AutoBuild.createFile(data,{
				success:function(txt){
					var result = {
					   	code : 200,
					   	data : results,
					    message : '部署成功'
					}
					res.send(result);
				}
			});
		}else{
			var result = {
			   	code : 400,
			   	data : results,
			    message : '获取内容失败'
			}
			res.send(result);
		}
	}, function(error) {
		res.send(error);
	}).catch(next);
})

// 详情
router.get('/detail', function(req, res, next) {
	var data = {
		id  : 'id'
  }
	var data = validate(res,req,data);
	if(!data){
		return;
	}
	var query = new AV.Query('Lore');
	query.get(data.id).then(function(results){
		// 删除成功
		var result = {
		   	code : 200,
		   	data : results,
		    message : '获取成功'
		}
		res.send(result);
	}, function(error) {
		res.send(error);
	}).catch(next);
})




// if(AS.config.APPID)
// AS.build('/lore',router);
module.exports = router;
