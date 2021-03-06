var express = require('express');
var router = express.Router();
var path = require('path');
var mysql = require('mysql');
var pool = require(path.join(__dirname, '/../../dependencies/connection.js'));
var makePayment = require(path.join(__dirname, '/../../dependencies/payment.js'));
var isLoggedIn = require(path.join(__dirname, '/../../dependencies/checkloggedin.js'));
var uniqid=require('uniqid');
var  cart_functionalities= require(path.join(__dirname,'/../../dependencies/cart_functionalities.js'));
var getTotalPrice=cart_functionalities.getTotalPrice;
var getTotalDeliveryCharge=cart_functionalities.getTotalDeliveryCharge;
var getTotalCashback=cart_functionalities.getTotalCashback;
var check = require(path.join(__dirname,'/../../dependencies/promocodelimit.js'));




router.post('/order',isLoggedIn,(req,res)=>{

pool.getConnection(function(error,conn){
if(error) console.log(error);
    var query="SELECT cart FROM userlist WHERE user_id="+mysql.escape(req.session.passport["user"]);
    conn.query(query,function(err,result){
        if(err) console.log(err);
        
        if(result.length==1)
        {   
            var cart=JSON.parse(result[0]['cart']);
            console.log(cart);
            var cart_items_array=cart["items"];
            if(cart_items_array.length==0)
            {
                res.redirect('/');
                return;
            }
            else{
                
                var TotalPrice;
                var TotalDeliveryCharge;
                getTotalPrice(cart_items_array,function(sum){
                    TotalPrice=sum;
                    getTotalDeliveryCharge(cart_items_array,function(sum2){
                        TotalDeliveryCharge=sum2;
                        var total_amount=parseInt(TotalPrice)+parseInt(TotalDeliveryCharge);
                        var q1="SELECT * FROM address WHERE user_id="+mysql.escape(req.session.passport["user"]);
                        conn.query(q1,(err2,res1)=>{
                            
                            if(err2){
                                console.log(err2);
                            }
                            console.log(res1);
                            res.render('cart/orderpage.handlebars',{cart:cart_items_array,address:res1,TotalPrice:TotalPrice,TotalDeliveryCharge:TotalDeliveryCharge,total_amount:total_amount});
                            
                        });
                    });
                });
            }
        }
        else{
            conn.release();
            res.redirect('/');
            return;
        }
    });
    conn.release();
});
});










router.post('/order/place',isLoggedIn,function(req,res){
    var address_id=req.body.address_id;
    pool.getConnection(function(err,conn){

        if(err) console.log(err);

        var order_id=uniqid('order-');
        var user_id=req.session.passport["user"];
        var user_phone;
        var items;
        var total_price;
        var promocode=req.body.promocode;
        var cashback_for_items;
        var net_amount;
        var delivery_charge;
        var net_amount_with_delivery_charge;
        var date=new Date();
        var order_status="pending";
        var payment_status="pending";
        var buyer_name;
        var email;
        var wallet_point;
        
        var q="SELECT * FROM userlist WHERE user_id="+mysql.escape(user_id);
        conn.query(q,function(err2,res2){
            if(err2) console.log(err2);

            if(res2.length==1)
            {           
                user_phone=res2[0].phone; 
                buyer_name=res2[0].name;
                email=res2[0].email;
                if(user_phone==null)
                {
                    res.redirect('/profile/?msg=Please Add Your Phone Number');
                }
                else if(email==null)
                {
                    res.redirect('/profile/?msg=Please Add Your Email');
                   
                }
                else{
                    
                    items=res2[0].cart;
                    wallet_point=res2[0].wallet;
                    var x=JSON.parse(items);
                    var cart_items_array=x["items"];
                    getTotalPrice(cart_items_array,function(sum){
                        total_price=sum;
                        getTotalDeliveryCharge(cart_items_array,function(sum2){
                            delivery_charge=sum2;
                            getTotalCashback(cart_items_array,function(sum3){
                                cashback_for_items=sum3;

                                /*console.log(`user_phone=${user_phone} buyer_name=${buyer_name} email=${email} wallet_point=${wallet_point} user_id=${user_id} 
                                items=${items} 
                                total_price=${total_price} promocode=${promocode} cashback_for_items=${cashback_for_items}  delivery_charge=${delivery_charge}  date=${date} order_status=${order_status} payment_status=${payment_status} address_id=${address_id}`);    
                                */  
                                promocodeAddressValidation(req,res,user_phone,buyer_name,email,wallet_point,user_id,order_id,user_id,items,total_price,promocode,cashback_for_items,delivery_charge,date,order_status,payment_status,address_id,function(){
                                    console.log(`promocodeAddressValidation() callback`);
                                });
                            });
                        });
                    });
                }
            }
            //end  if user exists
            else
            {
                res.redirect('/');
                return;
            }
            //end  if user does not exist
        });
        //end  get user details
        conn.release();

    });
    //end get pool connection 
});


function promocodeAddressValidation(req,res,user_phone,buyer_name,email,wallet_point,user_id,order_id,user_id,items,total_price,promocode,cashback_for_items,delivery_charge,date,order_status,payment_status,address_id,callback)
{
    var discount;
    var cashback;
    var used_wallet_point;
    var net_amount;
    var net_amount_with_delivery_charge;
    
    pool.getConnection(function(errr,conn){
        if(errr) console.log(errr);
        var q2="SELECT * FROM promocode WHERE promocode="+mysql.escape(promocode);
        conn.query(q2,function(err3,res3){
            if(err3) console.log(err3);
            if(res3.length==1)
            {
                
                var percentage=parseFloat(res3[0].percentage);
                var upto=parseFloat(res3[0].upto);
                var type=res3[0].type;
                var limit=res3[0].use_limit;
                check(req,promocode,limit,function(ans){

                    if(ans==1)
                    {
                        if(type=="discount")
                        {
                            var discount_amount=total_price*percentage/100;
                            if(discount_amount>upto)
                            discount_amount=upto;
    
                            used_wallet_point=0;
                            discount=discount_amount;//var
                            cashback=0;//var
                            net_amount=total_price-discount;//var
                        }
                        else if(type=="cashback")
                        {
                            var discount_amount=total_price*percentage/100;
                            if(discount_amount>upto)
                            discount_amount=upto;
    
                            used_wallet_point=0;
                            discount=0 ;//var
                            cashback=discount_amount;//var
                            net_amount=total_price;//var
                        }
                        else if(type=="wallet_point"){
                            var discount_amount=total_price*percentage/100;
                            if(discount_amount>upto)
                            discount_amount=upto;
                            if(discount_amount>wallet_point)
                            discount_amount=wallet_point;

                            used_wallet_point=discount_amount;
                            discount=0;
                            cashback=0;
                            net_amount=total_price-discount_amount;
                        }
                    }
                    else{
                        promocode="";
                        discount=0;
                        cashback=0;
                        used_wallet_point=0;
                        net_amount=total_price;
                    }
                    var address;
                    var address_contact;
                    net_amount_with_delivery_charge=net_amount+delivery_charge;
                    var q3="SELECT * FROM address WHERE id="+mysql.escape(address_id)+" && user_id="+mysql.escape(user_id);
                    conn.query(q3,function(err4,res4){
                        if(err4) console.log(err4);

                        if(res4.length==1)
                        {
                            
                            address=res4[0].locality+";"+res4[0].city+";"+res4[0].state+";"+res4[0].locality+";PIN-"+res4[0].pin;
                            address_contact="res4[0].contact";
                            var q4="INSERT INTO temp_order (order_id,user_id,items,total_price,promocode,discount,cashback,used_wallet_point,cashback_for_items,net_amount,delivery_charge,net_amount_with_delivery_charge,address,address_contact,date,order_status,payment_status) VALUES ("+mysql.escape(order_id)+","+mysql.escape(user_id)+","+mysql.escape(items)+","+mysql.escape(total_price)+","+mysql.escape(promocode)+","+mysql.escape(discount)+","+mysql.escape(cashback)+","+mysql.escape(used_wallet_point)+","+mysql.escape(cashback_for_items)+","+mysql.escape(net_amount)+","+mysql.escape(delivery_charge)+","+mysql.escape(net_amount_with_delivery_charge)+","+mysql.escape(address)+","+mysql.escape(address_contact)+","+mysql.escape(date)+","+mysql.escape(order_status)+","+mysql.escape(payment_status)+")";
                            console.log(q4);                        
                            conn.query(q4,function(err5,res5){
                                if(err5) console.log(err5);
                                console.log("data inserted in temporary table");

                                makePayment(res,order_id,"online shopping",net_amount_with_delivery_charge,user_phone,buyer_name,email,function(){
                                    console.log("makePayment() callback");
                                    return callback();
                                });
                            });
                            //end insert query
                        }
                        //end  if address valid
                        else{
                            res.redirect('/');
                            return;
                        }
                        //end  if address not valid  
                    });
                    //end get address query
                });
            }
            //end if promocode valid
            else{
                promocode="";
                discount=0;
                cashback=0;
                used_wallet_point=0;
                net_amount=total_price;
                var address;
                var address_contact;
                net_amount_with_delivery_charge=net_amount+delivery_charge;
                var q3="SELECT * FROM address WHERE id="+mysql.escape(address_id)+" && user_id="+mysql.escape(user_id);
                conn.query(q3,function(err4,res4){
                    if(err4) console.log(err4);

                    if(res4.length==1)
                    {
                        address=res4[0].locality+";"+res4[0].city+";"+res4[0].state+";"+res4[0].locality+";PIN-"+res4[0].pin;
                        address_contact=res4[0].contact;
                    }
                    //end  if address valid
                    else{
                        res.redirect('/');
                        return;
                    }
                    //end  if address not valid
                    var q4="INSERT INTO temp_order (order_id,user_id,items,total_price,promocode,discount,cashback,used_wallet_point,cashback_for_items,net_amount,delivery_charge,net_amount_with_delivery_charge,address,address_contact,date,order_status,payment_status) VALUES ("+mysql.escape(order_id)+","+mysql.escape(user_id)+","+mysql.escape(items)+","+mysql.escape(total_price)+","+mysql.escape(promocode)+","+mysql.escape(discount)+","+mysql.escape(cashback)+","+mysql.escape(used_wallet_point)+","+mysql.escape(cashback_for_items)+","+mysql.escape(net_amount)+","+mysql.escape(delivery_charge)+","+mysql.escape(net_amount_with_delivery_charge)+","+mysql.escape(address)+","+mysql.escape(address_contact)+","+mysql.escape(date)+","+mysql.escape(order_status)+","+mysql.escape(payment_status)+")";
                    console.log(q4);                        
                    conn.query(q4,function(err5,res5){
                        if(err5) console.log(err5);
                        console.log("data inserted in temporary table");

                        makePayment(res,order_id,"online shopping",net_amount_with_delivery_charge,user_phone,buyer_name,email,function(){
                            console.log("makePayment() callback");
                            return callback();

                        });
                        
                    });
                    //end insert query
                });
                //end get address query

            }
            //end if promocode invalid
        });
    //end promocode query

        conn.release();

    });
    //end pool getConnection
}



module.exports = router;
