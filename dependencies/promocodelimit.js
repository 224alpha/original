var path = require('path');
var mysql = require('mysql');
var pool = require(path.join(__dirname,'/../../dependencies/connection.js'));

function add(name,no,callback)
{
    var promocodes=[];
    var dict={'name':name,'no':no};
    promocodes.push(dict);
    var promocodesDict={"promocodes":promocodes};
    updateQuery(promocodesDict,req,function(){
        console.log("new promocode added to used_promocode");
        console.log("updateQuery() callback");
        callback();
    });
}

function check(promocode,limit,callback)
{
    pool.getConnection(function(err,conn){

        if(err) console.log(err);
        var q="SELECT used_promocodes FROM userlist WHERE user_id="+mysql.escape(req.session.passport['user']);
        conn.query(q,(err2,result)=>{
            if(err2) console.log(err2);
            if(result.length==1)
            {
                var used_promocodes=JSON.parse(result[0].used_promocodes);
                var promocodes=used_promocodes['promocodes'];
                for(var i=0;i<promocodes.length;i++)
                {
                    console.log(`key=${x}  value=${promocodes[x]}`);
                    if(promocode==promocodes[i]['name'])
                    {
                        if(promocodes[i]['no']<limit)
                        {
                            console.log("you can use the promocode");
                            var no=promocodes[i][no];
                            promocodes[i][no]=no+1; 
                            var dict={'promocodes':promocodes};
                            updateQuery(dict,req,function(){
                                console.log(`${promocodes[i]['name']} used one more time`);
                                console.log("updateQuery() callback");
                                callback();
                            });
                        }
                        else{
                            console.log("You have already reached the limit of this promocode");
                            callback();
                        }
                        return;
                    }
                }
                add(name,no,function(){
                    console.log("add() callback");
                    callback();
                });
            }
        });
    });
}


function updateQuery(dict,req,callback)
{
    console.log("updateQuery() called");
    pool.getConnection((err,conn)=>{
        if(err){
            console.log(err);
        }
        var query="UPDATE  userlist SET used_promocodes="+mysql.escape(JSON.stringify(dict))+" WHERE user_id="+mysql.escape(req.session.passport["user"]);
        conn.query(query,function(err2,result){
    
            if(err2) console.log(err2);
            if(result.affectedRows==1)
            {
                console.log("New Used_promocodes:\n");
                console.log(dict);
                callback();
            }
           
        });
        conn.release();

    });
}
module.exports=check;