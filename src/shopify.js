require("dotenv").config();
var jwt = require("jsonwebtoken");
var InventoryData = require("/connectors/mongo-jcs-connector");
var bcrypt = require("bcryptjs");
var axios = require("axios");
const User = require("./auth/auth.model");

exports.handler = async (event, context) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "Origin,Content-Type, Authorization, X-Requested-With",
    "Access-Control-Allow-Methods": "GET, POST,PUT,DELETE, OPTIONS",
  };

  var decoded;

   try {
    decoded = jwt.verify(
      event.headers.authorization,
      "M7HTLPdYICMz8sXCJz_leZmo"
    );
    if (!decoded) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "No token provided!",
        }),
        headers,
      };
    }
    //jwt.verify(token, process.env.SECRET, {});
  } catch (error) {
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Unauthorized!",
      }),
      headers,
    };
  }

  //sync product by sku
  if (event.httpMethod == "POST" && event.queryStringParameters.sku) {
    let body = JSON.parse(event.body);
    const user = await User.findOne({
      _id: decoded.id,
    });
    if(!user.shopifyApiKey || !user.shopifyApiToken || !user.shopifyUrl){
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "first need to add shopify credentials!",
        }),
        headers,
      };
    }
    const inventoryInfo = await InventoryData.findOne({
      sku: event.queryStringParameters.sku, createdUser: decoded.id 
    });
    //console.log(inventoryInfo);

    if (!inventoryInfo) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "No Products Found for given SKU!",
        }),
        headers,
      };
    } else if (inventoryInfo.shopify_id && inventoryInfo.shopify_id != "") {
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "alredy added",
        }),
        headers,
      };
    }
    
    try {
      var data = await mapDataShopify(inventoryInfo);
    var resp = "";
      var test = {
        product: {
          title: "test2456",
          body_html: "<strong>Good snowboard!</strong>",
          vendor: "Burton",
          product_type: "physical",
          variants: [
            {
              price: 100,
              sku: "qwerrr",
              inventory_quantity: 20,
            },
          ],
          status: "active",
          images: [
            {
              src: "https://jewelify.s3.us-east-2.amazonaws.com/1-12910/1-12910_1%20%286%29.jpg",
            },
          ],
        },
      };
      var response = "";
      await axios
        .post(
          `https://${user.shopifyApiKey}:${user.shopifyApiToken}@${user.shopifyUrl}/admin/api/2022-07/products.json`,
          {product: data}
        )
        .then(async (res) => {
          //console.log(res);
          response = res.data;
          //resp = JSON.parse(response.body);
          var apiUrl=`https://${user.shopifyApiKey}:${user.shopifyApiToken}@${user.shopifyUrl}/admin/api/2022-07/products/${response.product.id}.json`
        await axios
          .put(
            apiUrl,
            {product: data}
          )
          .then(async (res) => {
            //console.log(res);
            //response = res.data;
            inventoryInfo["shopify_id"] = response.product.id;
          try {
            await InventoryData.findOneAndUpdate(
              { sku: event.queryStringParameters.sku, createdUser: decoded.id },
              { $set: inventoryInfo }
            );
          } catch (error) {
            return {
              statusCode: 200,
              body: JSON.stringify({
                message: "failed!",
              }),
              headers,
            };
        }
            
        })

          
      }
        ),
        (error) => {
          return {
            statusCode: 200,
            body: JSON.stringify({
              message: "failed!",
              error: error,
            }),
            headers,
          };
        };
      //console.log(body);

      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "successfully synced",
          products: response,
        }),
        headers,
      };
    } catch (error) {
      //console.log(error);
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "failed!",
        }),
        headers,
      };
    }
  }

  //update synced product by sku
  if (event.httpMethod == "PUT" && event.queryStringParameters.sku) {
    const user = await User.findOne({
      _id: decoded.id,
    });

    if(!user.shopifyApiKey || !user.shopifyApiToken || !user.shopifyUrl){
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "first need to add shopify credentials!",
        }),
        headers,
      };
    }

    const inventoryInfo = await InventoryData.findOne({
      sku: event.queryStringParameters.sku,
       createdUser: decoded.id 
    });
    //console.log(inventoryInfo);

    if (!inventoryInfo) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "No Products Found for given SKU!",
        }),
        headers,
      };
    } else if (inventoryInfo.shopify_id && inventoryInfo.shopify_id != "") {
      try {
        var data = await mapDataShopify(inventoryInfo);
        var response = "";
        var apiUrl=`https://${user.shopifyApiKey}:${user.shopifyApiToken}@${user.shopifyUrl}/admin/api/2022-07/products/${inventoryInfo.shopify_id}.json`
        await axios
          .put(
            apiUrl,
            {product: data}
          )
          .then(async (res) => {
            //console.log(res);
            response = res.data;
            
        }
          ),
          (error) => {
            return {
              statusCode: 200,
              body: JSON.stringify({
                message: "failed!",
                error: error,
              }),
              headers,
            };
          };
        //console.log(body);
  
        return {
          statusCode: 200,
          body: JSON.stringify({
            message: "successfully updated",
            products: response,
          }),
          headers,
        };
      } catch (error) {
        //console.log(error);
        return {
          statusCode: 200,
          body: JSON.stringify({
            message: "failed!",
          }),
          headers,
        };
      }
      
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Item not synced.",
      }),
      headers,
    };
    
    
  }

   //delete synced product by sku
   if (event.httpMethod == "DELETE" && event.queryStringParameters.sku) {
    const user = await User.findOne({
      _id: decoded.id,
    });

    if(!user.shopifyApiKey || !user.shopifyApiToken || !user.shopifyUrl){
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "first need to add shopify credentials!",
        }),
        headers,
      };
    }

    const inventoryInfo = await InventoryData.findOne({
      sku: event.queryStringParameters.sku,
       createdUser: decoded.id 
    });
    //console.log(inventoryInfo);

    if (!inventoryInfo) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "No Products Found for given SKU!",
        }),
        headers,
      };
    } else if (inventoryInfo.shopify_id && inventoryInfo.shopify_id != "") {
      try {
        var response = "";
        var apiUrl=`https://${user.shopifyApiKey}:${user.shopifyApiToken}@${user.shopifyUrl}/admin/api/2022-07/products/${inventoryInfo.shopify_id}.json`
        await axios
          .delete(
            apiUrl
          )
          .then(async (res) => {
            //console.log(res);
            response = res.data;
            try {
              await InventoryData.findOneAndUpdate(
                { sku: event.queryStringParameters.sku, createdUser: decoded.id },
                { $set: {shopify_id:""} }
              );
            } catch (error) {
              return {
                statusCode: 200,
                body: JSON.stringify({
                  message: "failed!",
                }),
                headers,
              };
          }
            
        }
          ),
          (error) => {
            return {
              statusCode: 200,
              body: JSON.stringify({
                message: "failed!",
                error: error,
              }),
              headers,
            };
          };
        //console.log(body);
  
        return {
          statusCode: 200,
          body: JSON.stringify({
            message: "successfully deleted",
            products: response,
          }),
          headers,
        };
      } catch (error) {
        console.log(error);
        return {
          statusCode: 200,
          body: JSON.stringify({
            message: "failed!",
          }),
          headers,
        };
      }
      
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Item not synced.",
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

const mapDataShopify = async (item) => {
  const shopifyObj = {
    title: item.productName ? item.productName : "Premium Quality",
    product_type:item.jewelryType ? item.jewelryType : "physical",
    variants: [
      {
        price: item.retailPrice ? item.retailPrice : "0.00",
        sku: item.sku ? `${item.sku}` : "",
        inventory_quantity: item.qty ? item.qty : 0,
      },
    ],
    status: "active",
    body_html: `<strong>${
      item.longDescription ? item.longDescription : ""
    }</strong>`,
    images: await mapWooImage(item.productImages),
  };
  return shopifyObj;
};

const mapWooImage = (item) => {
  var imageArr = [];
  if (item.length > 0) {
    for (let i = 0; i < item.length; i++) {
      imageArr.push({
        position: i,
        src: item[i],
      });
    }
  }
  //console.log(imageArr);
  return imageArr;
};
