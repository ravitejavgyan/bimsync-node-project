var express = require('express');
const app = require('express')();
const mysql = require('mysql');
const cors = require('cors');
const queryString = require('querystring');
var request = require('request');
var path = require('path');
var ejs = require('ejs');
var fs  = require('fs');
const bodyParser = require('body-parser');
var multer = require('multer');
var upload = multer({ dest: 'uploads/' });
var base_url = 'https://api.bimsync.com/1.0/';
var bcf_base_url = 'https://bcf.bimsync.com/bcf/beta';

const db = mysql.createConnection ({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'vsdba'
});

// connect to database
db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('Connected to database');
});
app.use(cors());
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(__dirname + '/public'));

//This method suggests that index will load file login.ejs in views folder.
app.get('/', (req, res) => {
	res.render('login');
});


app.get('/bimsyncauthorize',(req,res) => {
	const apiAuthUrl = base_url+'oauth/authorize?'
  + queryString.stringify({
      client_id: 'YxGBksqE4TTE9t0',
      redirect_uri: 'http://localhost:4000/authorize',
      state: '1',
      response_type: 'code',
  });
res.redirect(apiAuthUrl);
});

app.get('/getOauthToken',(req,res) => {

    request({
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    uri: 'https://api.bimsync.com/oauth2/token',
    body: 'grant_type=client_credentials&client_id=YxGBksqE4TTE9t0&client_secret=5xy42C6N69HsEHM',
    method: 'POST'
  }, function (err, response, body) {
    //it works!
    if (err) {
return console.error('failed:', err);
}
console.log('server response--->',body);
});
});

app.get('/authorize',(req,res) => {
	
	var access_code = ""+req.query.code;
	var form = {
		client_id: 'YxGBksqE4TTE9t0',
		client_secret: '5xy42C6N69HsEHM',
		code: access_code,
		grant_type: 'authorization_code'
	};


var formData = queryString.stringify(form);
var contentLength = formData.length;

request({
    headers: {
      'Content-Length': contentLength,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    uri: base_url+'oauth/access_token',
    body: formData,
    method: 'POST'
  }, function (err, response, body) {
    //it works!
    if (err) {
return console.error('failed:', err);
}
var parseData = JSON.parse(body);
getUser(parseData.access_token);
let query = ""; // query database to get all the players

        // execute query
        db.query(query, (err, result) => {
        });


res.redirect('/projects/'+parseData.access_token);
  });
})



app.get('/projects/:accessToken',(req,res) => {
	//var username = getUser(req.params.accessToken,req,res);
	//console.log(username);
	request(
    {
        url : base_url+'projects',
        auth : {
            "bearer" : req.params.accessToken
        }
    },
    function (error, response, body) {
        // Do more stuff with 'body' here
    
        var resultJson = JSON.parse(body);
        var apiResult = {};
        apiResult = resultJson;
        var query = "SELECT u.name,u.email from api_users u join api_user_token t on u.id=t.user_id where t.access_token='"+req.params.accessToken+"'"; // query database to get all the players
	
        // execute query
        db.query(query, (err1, result1) => {

        	var userdata = encodeURIComponent(JSON.stringify(result1));
            
            userdata = JSON.parse(decodeURIComponent(userdata));
            

            
        res.render('index',{'accesstoken':req.params.accessToken,'projectlist': apiResult,'usercurrentdata':userdata}); 
            
        });
        
    }
);
});

app.post('/addproject/:accessToken',(req,res) => {
	request({
	    headers: {
	      'Content-Type': 'application/x-www-form-urlencoded'
	    },
	    uri: base_url+'projects/new',
	    json: req.body,
	    method: 'POST',
        auth : {
            "bearer" : req.params.accessToken
        }
	  }, function (err, response, body) {
	    //it works!
	    if (err) {
	return console.error('failed:', err);
	}
	res.redirect('/projects/'+req.params.accessToken);
	  });
});

app.post('/editproject/:accessToken/:id',(req, res) => {
	request({
	    headers: {
	      'Content-Type': 'application/x-www-form-urlencoded'
	    },
	    uri: base_url+'project?project_id='+req.params.id,
	    json: req.body,
	    method: 'PUT',
        auth : {
            "bearer" : req.params.accessToken
        }
	  }, function (err, response, body) {
	    //it works!
	    if (err) {
	return console.error('failed:', err);
	}
	console.log('server, ',body);
	res.redirect('/projects/'+req.params.accessToken);
	  });
});

app.get('/deleteproject/:accessToken/:id',(req,res) => {
	request({
	    headers: {
	      'Content-Type': 'application/x-www-form-urlencoded'
	    },
	    uri: base_url+'project?project_id='+req.params.id,
	    method: 'DELETE',
        auth : {
            "bearer" : req.params.accessToken
        }
	  }, function (err, response, body) {
	    //it works!
	    if (err) {
	return console.error('failed:', err);
	}
	console.log('server, ',body);
	res.redirect('/projects/'+req.params.accessToken);
	  });
});

app.get('/viewproducts/:accessToken/:Id/:name',(req,res) => {
	request({
	    
	    url: base_url+'project/products?project_id='+req.params.Id+'&page=1&per_page=100',
        auth : {
            "bearer" : req.params.accessToken
        }
	  }, function (err, response, body) {
	    //it works!
	    if (err) {
	return console.error('failed:', err);
	}
	var resultJson = JSON.parse(body);
        var apiResult = {};
        apiResult = resultJson;
        var query = "SELECT u.name,u.email from api_users u join api_user_token t on u.id=t.user_id where t.access_token='"+req.params.accessToken+"'"; // query database to get all the players
	
        // execute query
        db.query(query, (err1, result1) => {

        	var userdata = encodeURIComponent(JSON.stringify(result1));
            
            userdata = JSON.parse(decodeURIComponent(userdata));
        res.render('viewproducts',{'accesstoken':req.params.accessToken,'projectid':req.params.Id,'name':req.params.name,'productslist': apiResult,'usercurrentdata':userdata}); 
	  });
    });
});


app.get('/viewmodels/:accessToken/:id/:pname',(req,res) => {
	request(
    {
        url : base_url+'models?project_id='+req.params.id,
        auth : {
            "bearer" : req.params.accessToken
        }
    },
    function (error, response, body) {
        // Do more stuff with 'body' here
    	console.log('server response for models:',body);
        var resultJson = JSON.parse(body);
        var apiResult = {};
        apiResult = resultJson;
        var query = "SELECT u.name,u.email from api_users u join api_user_token t on u.id=t.user_id where t.access_token='"+req.params.accessToken+"'"; // query database to get all the players
         db.query(query, (err1, result1) => {

        	var userdata = encodeURIComponent(JSON.stringify(result1));
            
            userdata = JSON.parse(decodeURIComponent(userdata));
        res.render('models',{'accesstoken':req.params.accessToken,'projectid':req.params.id,'projectname':req.params.pname,'modellist': apiResult,'usercurrentdata':userdata}); 
    }
);
     });
});

app.post('/addmodel/:accessToken/:projectid/:pname',(req,res) => {
	request({
	    headers: {
	      'Content-Type': 'application/x-www-form-urlencoded'
	    },
	    uri: base_url+'models/new?project_id='+req.params.projectid,
	    json: req.body,
	    method: 'POST',
        auth : {
            "bearer" : req.params.accessToken
        }
	  }, function (err, response, body) {
	    //it works!
	    if (err) {
	return console.error('failed:', err);
	}
	res.redirect('/viewmodels/'+req.params.accessToken+'/'+req.params.projectid+'/'+req.params.pname);
	  });
});


app.post('/editmodel/:modelid/:accessToken/:id/:pname',(req, res) => {
	request({
	    headers: {
	      'Content-Type': 'application/x-www-form-urlencoded'
	    },
	    uri: base_url+'model?model_id='+req.params.modelid,
	    json: req.body,
	    method: 'PUT',
        auth : {
            "bearer" : req.params.accessToken
        }
	  }, function (err, response, body) {
	    //it works!
	    if (err) {
	return console.error('failed:', err);
	}
	console.log('server, ',body);
	res.redirect('/viewmodels/'+req.params.accessToken+'/'+req.params.id+'/'+req.params.pname);
	  });
});

app.get('/deletemodel/:modelid/:accessToken/:id/:pname',(req,res) => {
	request({
	    headers: {
	      'Content-Type': 'application/x-www-form-urlencoded'
	    },
	    uri: base_url+'model?model_id='+req.params.modelid,
	    method: 'DELETE',
        auth : {
            "bearer" : req.params.accessToken
        }
	  }, function (err, response, body) {
	    //it works!
	    if (err) {
	return console.error('failed:', err);
	}
	console.log('server, ',body);
	res.redirect('/viewmodels/'+req.params.accessToken+'/'+req.params.id+'/'+req.params.pname);
	  });
});


app.post('/importmodel/:modelid/:accessToken/:id/:pname',(req, res) => {
	console.log(req.body.file_name);
	request({
	    headers: {
	      'Content-Type': 'application/text'
	    },
	    uri: base_url+'model/import?model_id='+req.params.modelid+'&file_name='+req.body.filename+'&comment='+req.body.comment,
	    body: req.body.ifc_file,
	    method: 'PUT',
        auth : {
            "bearer" : req.params.accessToken
        }
	  }, function (err, response, body) {
	    //it works!
	    if (err) {
	return console.error('failed:', err);
	}
	console.log('server, ',body);
	var resultJson = JSON.parse(body);
        var apiResult = {};
        apiResult = resultJson;
        console.log(apiResult.token);
        request({
        	
	    uri: base_url+'model/import/status?token='+apiResult.token,
	    method: 'GET',
        auth : {
            "bearer" : req.params.accessToken
        }
	  }, function (err1, response1, body1) {
	    //it works!
	    if (err1) {
	return console.error('failed:', err1);
	}
	console.log('response from status:',body1);
	var resultJson1 = JSON.parse(body1);
        var apiResult1 = {};
        apiResult1 = resultJson1;
        var query = "SELECT u.name,u.email from api_users u join api_user_token t on u.id=t.user_id where t.access_token='"+req.params.accessToken+"'"; // query database to get all the players
         db.query(query, (err1, result1) => {

        	var userdata = encodeURIComponent(JSON.stringify(result1));
            
            userdata = JSON.parse(decodeURIComponent(userdata));
	res.render('viewstatus',{'accesstoken':req.params.accessToken,'projectid':req.params.id,'name':req.params.pname,'statuslist': apiResult1,'usercurrentdata':userdata});
	  });
	});
	  });
});

app.get('/exportmodel/:modelid/:accessToken/:id/:pname',(req, res) => {
	request({
        	
	    uri: base_url+'revision/export?model_id='+req.params.modelid,
	    method: 'GET',
        auth : {
            "bearer" : req.params.accessToken
        }
	  }, function (err, response, body) {
	    //it works!
	    if (err) {
	return console.error('failed:', err);
	}
	//console.log('response from status:',body);
	var str = body;
	str = str.replace(/\n/g, '<br/>');

	//var resultJson = JSON.parse(body);
      //  var apiResult = {};
       // apiResult = resultJson;
       var query = "SELECT u.name,u.email from api_users u join api_user_token t on u.id=t.user_id where t.access_token='"+req.params.accessToken+"'"; // query database to get all the players
         db.query(query, (err1, result1) => {

        	var userdata = encodeURIComponent(JSON.stringify(result1));
            
            userdata = JSON.parse(decodeURIComponent(userdata));
	res.render('exportmodel',{'accesstoken':req.params.accessToken,'projectid':req.params.id,'name':req.params.pname,'exportlist': str,'usercurrentdata':userdata});
});
	  });
});


app.get('/viewaccess/:modelid/:accessToken/:id/:pname',(req, res) => {
	var arrayjson = [
	{"model_id":req.params.modelid,"revision_id":"1"}
	];
	request({
        headers: {
	      'Content-Type': 'application/x-www-form-urlencoded'
	    },	
	    uri: base_url+'viewer/access?project_id='+req.params.id,
	    method: 'POST',
	    json: arrayjson,
        auth : {
            "bearer" : req.params.accessToken
        }
	  }, function (err, response, body) {
	    //it works!
	    if (err) {
	return console.error('failed:', err);
	}
	console.log('server response: ',body);

var query = "SELECT u.name,u.email from api_users u join api_user_token t on u.id=t.user_id where t.access_token='"+req.params.accessToken+"'"; // query database to get all the players
         db.query(query, (err1, result1) => {

        	var userdata = encodeURIComponent(JSON.stringify(result1));
            
            userdata = JSON.parse(decodeURIComponent(userdata));
	
	res.render('viewaccess',{'accesstoken':req.params.accessToken,'projectid':req.params.id,'name':req.params.pname,'accesslist': body,'usercurrentdata':userdata});
});
	  });
});

app.get('/view2daccess/:modelid/:accessToken/:id/:pname',(req, res) => {
	
	request({
       
	    uri: 'https://api.bimsync.com/beta/viewer2d/access?project_id='+req.params.id+'&model_id='+req.params.modelid+'&revision_id=1',
	    method: 'POST',
        auth : {
            "bearer" : req.params.accessToken
        }
	  }, function (err, response, body) {
	    //it works!
	    if (err) {
	return console.error('failed:', err);
	}
	console.log('server response: ',body);

	var resultJson = JSON.parse(body);
        var apiResult = {};
        apiResult = resultJson;

        var arrayjson = [
	{"model_id":req.params.modelid,"revision_id":"1"}
	];
	request({
        headers: {
	      'Content-Type': 'application/x-www-form-urlencoded'
	    },	
	    uri: base_url+'viewer/access?project_id='+req.params.id,
	    method: 'POST',
	    json: arrayjson,
        auth : {
            "bearer" : req.params.accessToken
        }
	  }, function (err1, response1, body1) {


var query = "SELECT u.name,u.email from api_users u join api_user_token t on u.id=t.user_id where t.access_token='"+req.params.accessToken+"'"; // query database to get all the players
         db.query(query, (err1, result1) => {

        	var userdata = encodeURIComponent(JSON.stringify(result1));
            
            userdata = JSON.parse(decodeURIComponent(userdata));
	
	res.render('view2daccess',{'accesstoken':req.params.accessToken,'projectid':req.params.id,'name':req.params.pname,'accesslist': apiResult,'usercurrentdata':userdata,'access':body1});
});
});
	  });
});

app.get('/viewcomments/:modelid/:accessToken/:id/:pname',(req, res) => {
	request({
        	
	    uri: base_url+'revisions?model_id='+req.params.modelid,
	    method: 'GET',
        auth : {
            "bearer" : req.params.accessToken
        }
	  }, function (err, response, body) {
	    //it works!
	    if (err) {
	return console.error('failed:', err);
	}
	console.log('server response: ',body);

var resultJson = JSON.parse(body);
        var apiResult = {};
        apiResult = resultJson;
	var query = "SELECT u.name,u.email from api_users u join api_user_token t on u.id=t.user_id where t.access_token='"+req.params.accessToken+"'"; // query database to get all the players
         db.query(query, (err1, result1) => {

        	var userdata = encodeURIComponent(JSON.stringify(result1));
            
            userdata = JSON.parse(decodeURIComponent(userdata));
	res.render('viewcomments',{'modelid':req.params.modelid,'accesstoken':req.params.accessToken,'projectid':req.params.id,'name':req.params.pname,'commentlist': apiResult,'usercurrentdata':userdata});
});
	  });
});

app.post('/issuedemo',(req, res) => {
	var ids = req.body.ids;
	var projectid = req.body.projectid;
	var arrayjson = {"ids":ids,"revisionRefs":["1f22202d-2574-467b-a18a-b509c85f351b"],"limit":1000};
	request({
		headers: {
	      'Content-Type': 'application/json',
	      'cookie': '_ga=GA1.2.1282463883.1541161151; _gid=GA1.2.313110427.1542003756; _bs_sess=74bqck1wofmi13a6326g5huf5; __hstc=2887215.5edd12030a53d65847cef73965c2e8f7.1542091406479.1542091406479.1542091406479.1; __hssrc=1; hubspotutk=5edd12030a53d65847cef73965c2e8f7; _gat=1'
	    },
		uri: 'https://bimsync.com/project/'+projectid+'/inspect/issue-numbers',
		method: 'post',
		json: arrayjson
	}, function(err, response, body) {

		var myjsonstring = JSON.stringify(body);

		var resultJson = JSON.parse(myjsonstring);

		var apiResult = {};
		apiResult.data = resultJson;

		console.log('server response --->',apiResult);

		res.send(apiResult);
	}
	);
});

function getUser(accesstoken)
{
	//console.log(bcf_base_url+'beta/currentuser');
	//var resultJson;
	request({
        	
	    url: 'https://bcf.bimsync.com/bcf/beta/current-user',
        auth : {
            "bearer" : accesstoken
        }
	  }, function (err, response, body) {
	    //it works!
	    if (err) {
	return console.error('failed:', err);
	}
	console.log('server response from get user: ',body);

	resultJson = JSON.parse(body);
	
	let query = "insert into api_users(name,email) values('"+resultJson.name+"','"+resultJson.id+"')"; // query database to get all the players

        // execute query
        db.query(query, (err, result) => {
	
	var insertid = result.insertId;

	db.query("insert into api_user_token(user_id,access_token) values("+insertid+",'"+accesstoken+"')", (err1, result1) => {

	});

	return resultJson.name;
		});
        
   });
   
}

app.get('/bcf/:accessToken',(req, res) => {

	request(
    {
        url : base_url+'projects',
        auth : {
            "bearer" : req.params.accessToken
        }
    },
    function (error, response, body) {
        // Do more stuff with 'body' here
    
        var resultJson = JSON.parse(body);
        var apiResult = {};
        apiResult = resultJson;
        var query = "SELECT u.name,u.email from api_users u join api_user_token t on u.id=t.user_id where t.access_token='"+req.params.accessToken+"'"; // query database to get all the players
	
        // execute query
        db.query(query, (err1, result1) => {

        	var userdata = encodeURIComponent(JSON.stringify(result1));
            
            userdata = JSON.parse(decodeURIComponent(userdata));
            

            
        res.render('bcf/index',{'accesstoken':req.params.accessToken,'projectlist': apiResult,'usercurrentdata':userdata}); 
            
        });
        
    }
);

});

app.get('/viewissueboards/:accessToken/:pid/:pname',(req,res) => {
	
request(
    {
        url : bcf_base_url+'/projects?bimsync_project_id='+req.params.pid,
        auth : {
            "bearer" : req.params.accessToken
        }
    },
    function (error, response, body) {
        // Do more stuff with 'body' here
    
        var resultJson = JSON.parse(body);
        var apiResult = {};
        apiResult = resultJson;
        
        var query = "SELECT u.name,u.email from api_users u join api_user_token t on u.id=t.user_id where t.access_token='"+req.params.accessToken+"'"; // query database to get all the players
	
        // execute query
        db.query(query, (err1, result1) => {

        	var userdata = encodeURIComponent(JSON.stringify(result1));
            
            userdata = JSON.parse(decodeURIComponent(userdata));

            

            
        res.render('bcf/issueboard',{'accesstoken':req.params.accessToken,'projectid':req.params.pid,'projectname':req.params.pname,'issuelist': apiResult,'usercurrentdata':userdata}); 
            
        });
        
    }
);
});

app.post('/addissueboard/:accessToken',(req, res) => {
	
	var jsonbody = {"name":req.body.name,"bimsync_project_id":req.body.bprojectid};
	request({
	    
	    uri: bcf_base_url+'/projects',
	    json: jsonbody,
	    method: 'POST',
        auth : {
            "bearer" : req.params.accessToken
        }
	  }, function (err, response, body) {
	    //it works!
	    if (err) {
	return console.error('failed:', err);
	}
	
	res.redirect('/viewissueboard/'+req.params.accessToken+'/'+req.body.bprojectid+'/'+req.body.bname);
	  });
});

app.get('/viewtopics/:accessToken/:pid/:bpid/:bname',(req,res) => {
	getstatuses(req.params.accessToken,req.params.pid,req,res);
	getusers(req.params.accessToken,req.params.pid,req,res);
	gettypes(req.params.accessToken,req.params.pid,req,res);
request(
    {
        url : bcf_base_url+'/projects/'+req.params.pid+'/topics',
        auth : {
            "bearer" : req.params.accessToken
        }
    },
    function (error, response, body) {
        // Do more stuff with 'body' here
    
        var resultJson = JSON.parse(body);
        var apiResult = {};
        var status = {};
        var types = {};
        var user = {};
        apiResult = resultJson;
        
        var query = "SELECT u.name,u.email from api_users u join api_user_token t on u.id=t.user_id where t.access_token='"+req.params.accessToken+"'"; // query database to get all the players
	
        // execute query
        db.query(query, (err1, result1) => {

        	var userdata = encodeURIComponent(JSON.stringify(result1));
            
            userdata = JSON.parse(decodeURIComponent(userdata));
            
 db.query("select * from api_status",(err2, result2) => {

            	status = encodeURIComponent(JSON.stringify(result2));

            	status = JSON.parse(decodeURIComponent(status));

            	db.query("select * from api_types",(err3, result3) => {

            	types = encodeURIComponent(JSON.stringify(result3));

            	types = JSON.parse(decodeURIComponent(types));

            	db.query("select * from api_users_list",(err4, result4) => {

            	user = encodeURIComponent(JSON.stringify(result4));

            	user = JSON.parse(decodeURIComponent(user));

            

           res.render('bcf/viewtopics',{'accesstoken':req.params.accessToken,'projectid':req.params.pid,'bprojectid':req.params.bpid,'projectname':req.params.bname,'topicslist': apiResult,'usercurrentdata':userdata,'statuses':status,'topictype':types,'usertypes':user}); 

           });
           

            });

            

            });

            
            
        
            
        });
        
    }
);
});

app.post('/addtopics/:accessToken',(req, res) => {
		var jsonbody = {"topic_type":req.body.topic_type,"topic_status":req.body.topic_status,"title":req.body.title,"assigned_to":req.body.assigned_to,"description":req.body.description};
console.log(req.body.bname);
request(
    {
        url : bcf_base_url+'/projects/'+req.body.projectid+'/topics',
        json: jsonbody,
        method: 'POST',
        auth : {
            "bearer" : req.params.accessToken
        }
    },
    function (error, response, body) {
        // Do more stuff with 'body' here
    
        //var resultJson = JSON.parse(body);
       console.log('server response ------->',body);

       res.redirect('/viewtopics/'+req.params.accessToken+'/'+req.body.projectid+'/'+req.body.bprojectid+'/'+req.body.bname);
        
    }
);	
});

app.post('/edittopic/:accessToken',(req,res) =>{
	var jsonbody = {"topic_type":req.body.topic_type,"topic_status":req.body.topic_status,"title":req.body.title,"assigned_to":req.body.assigned_to,"description":req.body.description};
	request(
    {
        url : bcf_base_url+'/projects/'+req.body.projectid+'/topics/'+req.body.guid,
        json: jsonbody,
        method: 'PUT',
        auth : {
            "bearer" : req.params.accessToken
        }
    },
    function (error, response, body) {
        // Do more stuff with 'body' here
    
        //var resultJson = JSON.parse(body);
       console.log('server response ------->',body);

       res.redirect('/viewtopics/'+req.params.accessToken+'/'+req.body.projectid+'/'+req.body.bprojectid+'/'+req.body.bname);
        
    }
);	
});

app.get('/deletetopic/:accessToken/:projectid/:guid/:bprojectid/:bname',(req, res) => {
	request({
		url: bcf_base_url+'/projects/'+req.params.projectid+'/topics/'+req.params.guid,
		method: 'DELETE',
		auth : {
            "bearer" : req.params.accessToken
        }	
	},
	function(error, response, body) {

		res.redirect('/viewtopics/'+req.params.accessToken+'/'+req.body.projectid+'/'+req.body.bprojectid+'/'+req.body.bname);

	});
});

app.post('/addcomments/:accessToken',(req,res) => {
	var jsonbody = {"status":req.body.status,"verbal_status":req.body.verbal_status,"comment":req.body.comment};

	request(
    {
        url : bcf_base_url+'/projects/'+req.body.projectid+'/topics/'+req.body.guid+'/comments',
        json: jsonbody,
        method: 'POST',
        auth : {
            "bearer" : req.params.accessToken
        }
    },
    function (error, response, body) {
        // Do more stuff with 'body' here
    
        //var resultJson = JSON.parse(body);
       console.log('server response ------->',body);

       res.redirect('/viewtopics/'+req.params.accessToken+'/'+req.body.projectid+'/'+req.body.bprojectid+'/'+req.body.bname);
        
    }
);	

});

app.post('/uploaddocument/:accessToken/:projectid/:bprojectid/:projectname',upload.single('document'),function(req,res){
	var tmp_path = req.file.path;

  /** The original name of the uploaded file
      stored in the variable "originalname". **/
  var target_path = 'uploads/' + req.file.originalname;

  /** A better way to copy the uploaded file. **/
  var src = fs.createReadStream(tmp_path);
  var dest = fs.createWriteStream(target_path);
  src.pipe(dest);
  src.on('end', function() {
  	request({
  		headers: {
      	'Content-Disposition': 'attachment;filename='+req.file.originalname
    	},
  		url: bcf_base_url+'/projects/'+req.params.projectid+'/documents',
  		method: 'post',
  		formData: req.file,
  		auth : {
            "bearer" : req.params.accessToken
        }
    },	
    function(error,response,body)
    {
    	res.redirect('/viewissueboard/'+req.params.accessToken+'/'+req.params.bprojectid+'/'+req.params.projectname);
  	});
  });
});

function getcurrentuser(accesstoken){
	let query = "SELECT u.name,u.email from api_users u join api_user_token t on u.id=t.user_id where t.access_token='"+accesstoken+"'"; // query database to get all the players
	var userdata = '';
        // execute query
        db.query(query, (err, result) => {

        	userdata = encodeURIComponent(JSON.stringify(result));
            
            userdata = JSON.parse(decodeURIComponent(resultJson));
            

            
            
        });
}

function getstatuses(accesstoken,pid,req,res){

	request(
    {
        url : bcf_base_url+'/projects/'+pid+'/extensions/statuses',
        auth : {
            "bearer" : req.params.accessToken
        }
    },
    function (error, response, body) {
    	var json = JSON.parse(body);
    	for(var i = 0;i<json.length;i++)
    	{
	let query = "insert into api_status(name,color,type) values('"+json[i].name+"','"+json[i].color+"','"+json[i].type+"')"; // query database to get all the players
	
        // execute query
        db.query(query, (err, result) => {

        	
		
            
            
        });
    }
    });
}

function getusers(accesstoken,pid,req,res){

	request(
    {
        url : bcf_base_url+'/projects/'+pid+'/extensions/users',
        auth : {
            "bearer" : req.params.accessToken
        }
    },
    function (error, response, body) {
    	var json = JSON.parse(body);
    	for(var i = 0;i<json.length;i++)
    	{
	let query = "insert into api_users_list(name,email) values('"+json[i].name+"','"+json[i].id+"')"; // query database to get all the players
	
        // execute query
        db.query(query, (err, result) => {

        	
            
        });
    }
    });
}


function gettypes(accesstoken,pid,req,res){

	request(
    {
        url : bcf_base_url+'/projects/'+pid+'/extensions/types',
        auth : {
            "bearer" : req.params.accessToken
        }
    },
    function (error, response, body) {
    	var json = JSON.parse(body);
    	for(var i = 0;i<json.length;i++)
    	{
	let query = "insert into api_types(name,color) values('"+json[i].name+"','"+json[i].color+"')"; // query database to get all the players
	
        // execute query
        db.query(query, (err, result) => {

        	
            
        });

    }
});
}




app.listen(4000, () => console.log(`Express server running on port 4000`));