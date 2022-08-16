require("dotenv").config();
var jwt = require("jsonwebtoken");
var InventoryData = require("/connectors/mongo-jcs-connector");
const User = require("./auth/auth.model");
var jcsDataOp = require("/dao/jcs-data-operation");
var axios = require("axios");
var OrderData = require("/connectors/order");
var CustomerInfo=require("/connectors/customerInfo");

exports.handler = async (event, context) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "Origin,Content-Type, Authorization, X-Requested-With",
    "Access-Control-Allow-Methods": "GET, POST,PUT,DELETE, OPTIONS",
  };

  //product create web-hook
  //console.log(event)
  let body = JSON.parse(event.body);
  //console.log(body);
  var user=""
     user = await User.findOne({
      shopifyApiKey: event.queryStringParameters.apiKey,
    }).catch((err) => {
      //error, its handled now!
    });

  if (
    event.httpMethod == "POST" &&
    event.queryStringParameters.type == "product_create_webhook"
  ) {
    console.log("***************************")
    

    var uesrObj={}
    uesrObj['sku']=body.variants[0].sku
    if(user){
      uesrObj['createdUser']=user._id
    }


    const check = await InventoryData.findOne(uesrObj).catch((err) => {
      //error, its handled now!
    });
    //console.log(body)
    if (!check) {
      const data = await mapDataShopifytoDB(body);
      data["createdUser"] = user?user._id:"";
      await jcsDataOp.save(data).catch((err) => {
        //error, its handled now!
      });
    }
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "product created",
      }),
      headers,
    };
  }

  if (
    event.queryStringParameters.type == "product_update_webhook"
  ) {
    console.log("***************************")
    
    var uesrObj={}
    uesrObj['sku']=body.variants[0].sku
    if(user){
      uesrObj['createdUser']=user._id
    }


    const check = await InventoryData.findOne(uesrObj).catch((err) => {
      //error, its handled now!
    });
    //console.log(body)
    if (check) {
      const data = await mapDataShopifytoDB(body);
      data["createdUser"] = user?user._id:"";
      await InventoryData.findOneAndUpdate(uesrObj,{$set: data }).catch((err) => {
        //error, its handled now!
      });
    }else{
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "product not found in db",
        }),
        headers,
      };
    }
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "product updated",
      }),
      headers,
    };
  }

  if (
    event.queryStringParameters.type == "product_delete_webhook"
  ) {
    console.log("***************************")
    
    var uesrObj={shopify_id:body.id}
    /* uesrObj['sku']=body.variants[0].sku
    if(user){
      uesrObj['createdUser']=user._id
    } */


    const check = await InventoryData.findOne(uesrObj).catch((err) => {
      //error, its handled now!
    });
    //console.log(body)
    if (check) {
      //const data = await mapDataShopifytoDB(body);
      await InventoryData.findOneAndUpdate(uesrObj,{$set: {shopify_id:""} }).catch((err) => {
        //error, its handled now!
      });
    }else{
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "product not found in db",
        }),
        headers,
      };
    }
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "product deleted",
      }),
      headers,
    };
  }

  if (
    event.queryStringParameters.type == "create_order_webhook"
  ) {
    console.log("***************************")
    //console.log("done");
    let body = JSON.parse(event.body);
    console.log(body);
    const order = await new OrderData({
      order: body,
      order_status: body.status?body.status:"",
      order_id: body.id,
      platform:"shopify",
    });
    await order.save().catch((err) => {
      //error, its handled now!
    });


    const templateParams = {
      service_id: "service_td1ge5n",
      template_id: "template_n9hd1bx",
      accessToken: "-L4-14eRhemMRgdavcaLG",
      user_id: "AfVOYQ8ZwAoTPryZa",
      template_params: {
        email: "jewelify123.project@gmail.com",
        platform:"shopify",
        orderID: body.id,
        orderItems:JSON.stringify(body.line_items),
        orderStatus:body.status?body.status:"",
        first_name:body.billing_address?body.billing_address.first_name:"none",
        last_name:body.billing_address?body.billing_address.last_name:"none",
        company:body.billing_address?body.billing_address.company:"none",
        address_1:body.billing_address?body.billing_address.address_1:"none",
        address_2:body.billing_address?body.billing_address.address_2:"none",
        city:body.billing_address?body.billing_address.city:"none",
        state:body.billing_address?body.billing_address.province:"none",
        postcode:body.billing_address?body.billing_address.zip:"none",
        country:body.billing_address?body.billing_address.country:"none",
        phone:body.billing_address?body.billing_address.phone:"none",
      },
    };
    await axios.post("https://api.emailjs.com/api/v1.0/email/send", templateParams).then(
      (response) => {
        console.log("SUCCESS!", response.data,);
      },
      (err) => {
        console.log("FAILED...", err);
      }
    );

    const chngeQty = body.line_items.map(async (item) => {
      
        var qty = parseInt(item.quantity);
        var orders = [body.id];

        let prevData = await InventoryData.findOne({
          sku: item.sku,
          createdUser: user._id,
        }).catch((err) => {
          console.log(err)
        });;

        qty = parseInt(prevData.qty) - qty;
        if(qty==0){
          const params = {
            service_id: "service_td1ge5n",
            template_id: "template_gr6vofb",
            accessToken: "-L4-14eRhemMRgdavcaLG",
            user_id: "AfVOYQ8ZwAoTPryZa",
            template_params: {
              email: "jewelify123.project@gmail.com",
              sku:prevData.sku,
              productId:prevData.productName
              
            },
          };
          await axios.post("https://api.emailjs.com/api/v1.0/email/send", params).then(
            (response) => {
              console.log("SUCCESS!", response.data,);
            },
            (err) => {
              console.log("FAILED...", err);
            }
          );
        }
        else if(qty==1){
          const params = {
            service_id: "service_td1ge5n",
            template_id: "template_fpwqfu9",
            accessToken: "-L4-14eRhemMRgdavcaLG",
            user_id: "AfVOYQ8ZwAoTPryZa",
            template_params: {
              email: "jewelify123.project@gmail.com",
              sku:prevData.sku,
              productId:prevData.productName,
              remainingStock:"1"
            },
          };
          await axios.post("https://api.emailjs.com/api/v1.0/email/send", params).then(
            (response) => {
              console.log("SUCCESS!", response.data,);
            },
            (err) => {
              console.log("FAILED...", err);
            }
          );
        }
        else if(qty==2){
          const params = {
            service_id: "service_td1ge5n",
            template_id: "template_fpwqfu9",
            accessToken: "-L4-14eRhemMRgdavcaLG",
            user_id: "AfVOYQ8ZwAoTPryZa",
            template_params: {
              email: "jewelify123.project@gmail.com",
              sku:prevData.sku,
              productId:prevData.productName,
              remainingStock:"2"
              
            },
          };
          await axios.post("https://api.emailjs.com/api/v1.0/email/send", params).then(
            (response) => {
              console.log("SUCCESS!", response.data,);
            },
            (err) => {
              console.log("FAILED...", err);
            }
          );
        }
        else if(qty==5){
          const params = {
            service_id: "service_td1ge5n",
            template_id: "template_fpwqfu9",
            accessToken: "-L4-14eRhemMRgdavcaLG",
            user_id: "AfVOYQ8ZwAoTPryZa",
            template_params: {
              email: "jewelify123.project@gmail.com",
              sku:prevData.sku,
              productId:prevData.productName,
              remainingStock:"5"
              
            },
          };
          await axios.post("https://api.emailjs.com/api/v1.0/email/send", params).then(
            (response) => {
              console.log("SUCCESS!", response.data,);
            },
            (err) => {
              console.log("FAILED...", err);
            }
          );
        }
        else if(qty==10){
          const params = {
            service_id: "service_td1ge5n",
            template_id: "template_fpwqfu9",
            accessToken: "-L4-14eRhemMRgdavcaLG",
            user_id: "AfVOYQ8ZwAoTPryZa",
            template_params: {
              email: "jewelify123.project@gmail.com",
              sku:prevData.sku,
              productId:prevData.productName,
              remainingStock:"10"
              
            },
          };
          await axios.post("https://api.emailjs.com/api/v1.0/email/send", params).then(
            (response) => {
              console.log("SUCCESS!", response.data,);
            },
            (err) => {
              console.log("FAILED...", err);
            }
          );
        }
        else if(qty==20){
          const params = {
            service_id: "service_td1ge5n",
            template_id: "template_fpwqfu9",
            accessToken: "-L4-14eRhemMRgdavcaLG",
            user_id: "AfVOYQ8ZwAoTPryZa",
            template_params: {
              email: "jewelify123.project@gmail.com",
              sku:prevData.sku,
              productId:prevData.productName,
              remainingStock:"20"
              
            },
          };
          await axios.post("https://api.emailjs.com/api/v1.0/email/send", params).then(
            (response) => {
              console.log("SUCCESS!", response.data,);
            },
            (err) => {
              console.log("FAILED...", err);
            }
          );
        }
        /* let orders_IDs =
          prevData.orders_IDs.length > 0
            ? orders.concat(prevData.orders_IDs)
            : orders; */

        await InventoryData.findOneAndUpdate(
          {
            sku: item.sku,
            createdUser: user._id,
          },
          { $set: { qty: qty } }
        );

        
    const checkCustomer=await CustomerInfo.findOne({ email: body.email });
    if(checkCustomer){
      var orderObj={
        platform:"shopify",
        item_SKU:item.sku,
        order_id:body.id,
        status:"online",
      }
    
      await CustomerInfo.findOneAndUpdate({ email: body.email },{ $push: { orders: orderObj } });
    }else{
      var orderObj={
        platform:"shopify",
        item_SKU:item.sku,
        order_id:body.id,
        status:"online"
      }

      const customer = await new CustomerInfo({
        orders:[orderObj],
        email:body.email,
        mobile:body.phone,
      });
      await customer.save().catch((err) => {
        //error, its handled now!
      });
    }
       
    });

    const finalResult = await Promise.all(chngeQty);
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "order added",
      }),
      headers,
    };
    
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Method not allowed",
    }),
    headers: headers,
  };
};

const mapDataShopifytoDB = async (item) => {
  const shopifyObj = {
    productName: item.title ? item.title : "Premium Quality",
    jewelryType: item.product_type ? item.product_type : "physical",
    retailPrice: item.variants[0].price ? item.variants[0].price : "0.00",
    qty: item.variants[0].inventory_quantity
      ? item.variants[0].inventory_quantity
      : 0,
    sku: item.variants[0].sku ? item.variants[0].sku : "noSku",
    longDescription: item.body_html ? item.body_html : "",
    productImages: await mapWooImage(item.images),
    shopify_id: item.id ? item.id : "",
  };
  return shopifyObj;
};

const mapWooImage = (item) => {
  var imageArr = [];
  if (item.length > 0) {
    for (let i = 0; i < item.length; i++) {
      imageArr.push(item[i].src);
    }
  }
  //console.log(imageArr);
  return imageArr;
};
