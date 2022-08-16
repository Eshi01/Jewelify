require("dotenv").config();
var jwt = require("jsonwebtoken");
var jcsDataOp = require("/dao/jcs-data-operation");
var User = require("./auth/auth.model");

var InventoryData = require("/connectors/mongo-jcs-connector");

exports.handler = async (event, res) => {
  //console.log(event)
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Origin,Content-Type, Authorization, X-Requested-With",
    "Access-Control-Allow-Methods": "GET, POST,PUT,DELETE, OPTIONS",
  };
  var decoded;
  var token=event.headers.authorization?event.headers.authorization:event.queryStringParameters.token?event.queryStringParameters.token:'';

  try {
    decoded = jwt.verify(
      token,
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

    const logedUser = await User.findOne({ email: decoded.id });
    console.log(logedUser);
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

  if (event.httpMethod == "POST" ) {
    let body = JSON.parse(event.body);
    console.log(body.imageNaming)

    if(body.imageNaming=="styleNumber"||body.imageNaming=="stylenumber"||body.imageNaming=="sku"||body.imageNaming=="SKU"){
      const inventoryInfo = await InventoryData.findOne({
        createdUser: decoded.id,
      });
  
      if (!inventoryInfo) {
        return {
          statusCode: 200,
          body: JSON.stringify({
            message: "No Products Found",
          }),
           headers,
        };
      }

      try {
        await InventoryData.updateMany(
          {createdUser: decoded.id, },
          { $set: {imageNaming:body.imageNaming} }

        );
      } catch (error) {
        return {
          statusCode: 200,
          body: JSON.stringify({
            message: "update failed",
            products: body,
          }),
           headers,
        };
      }
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "You have successfully upadated.",
          products: body,
        }),
         headers,
      };


    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "request body shoul be {imageNaming:SKU/styleNumber}",
        products: body,
      }),
       headers,
    };
    
  }

 /* if (event.httpMethod == "PUT" ) {
    let body = JSON.parse(event.body);
    try {
      await InventoryData.updateMany(
        {createdUser: decoded.id, },
        { $set: {id:"",productImages:[]} }

      );
    } catch (error) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "update failed",
          products: body,
        }),
         headers,
      };
    }
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "You have successfully upadated.",
        products: body,
      }),
       headers,
    };
} 
 */
return {
  statusCode: 200,
  body: JSON.stringify({
    message: "Method not allowed",
  }),
  headers,
};
}