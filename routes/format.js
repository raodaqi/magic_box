'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var cheerio = require('cheerio');
var charset = require('superagent-charset');
var superagent = require('superagent');
var toMarkdown = require('to-markdown');
var AutoBuild = require('./auto_build.js');
// var upndown = require('upndown');


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
				  "title: 影响力的武器\n"+
				  "date: 2017-05-10 21:00:52\n"+
				  "tags: 影响力\n"+
				  "---\n"+
				  "\n"+toMarkdown(content);
		var data = {
			content  : content,
			title    : title,
			author   : author,
			paltform : "简书" 
		}
		return data;
	}
}

function format(url,para,res){
	superagent.get(url)
	  .query(para)
	  .end((err, result) => {
		if(result.statusCode == 200){
				var markDownText = fPaltform(url,result);
				console.log(markDownText);
				//
			}else{
				res.send(err);
			}
		});
}
router.get('/', function(req, res, next) {
	var url = "http://www.jianshu.com/p/6739f1cc688e";
	var para = {};
	format(url,para,res);
})

module.exports = router;
