require("dotenv").config();
const User = require("./auth/auth.model");
var jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
var bcrypt = require("bcryptjs");

exports.handler = async (event, context) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "Origin,Content-Type, Authorization, X-Requested-With",
    "Access-Control-Allow-Methods": "GET, POST,PUT,DELETE, OPTIONS",
  };

  await mongoose
    .connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
    })
    .then(() => {
      console.log("Successfully connected to MongoDB.");
    })
    .catch((err) => {
      console.error("Connection error", err);
      process.exit();
    });

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

  //update password and profile
  if (event.httpMethod == "PUT" && event.queryStringParameters.type) {
    let body = JSON.parse(event.body);
    const user = await User.findOne({
      _id: decoded.id,
    });

    if (event.queryStringParameters.type == "updatePassword") {
      const passwordIsValid = bcrypt.compareSync(
        body.oldPassword,
        user.password
      );
      if (!passwordIsValid) {
        return {
          statusCode: 200,
          body: JSON.stringify({
            message: "please enter correct old password..",
          }),
          headers,
        };
      }
      let newpass = { password: bcrypt.hashSync(body.newPassword, 8) };

      try {
        await User.findOneAndUpdate({ _id: decoded.id }, { $set: newpass });
      } catch (error) {
        return {
          statusCode: 200,
          body: JSON.stringify({
            message: "update failed",
          }),
          headers,
        };
      }

      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "You have successfully updated.",
        }),
        headers,
      };
    } else if (event.queryStringParameters.type == "updateProfile") {
      var obj={}
    if(body.name){
      obj["name"]=body.name;
    }
    if(body.name){
      obj["email"]=body.email;
    }
    if(body.name){
      obj["companyName"]=body.companyName;
    }
      try {
        await User.findOneAndUpdate({ _id: decoded.id }, { $set: obj });
      } catch (error) {
        return {
          statusCode: 200,
          body: JSON.stringify({
            message: "update failed",
          }),
          headers,
        };
      }

      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "You have successfully updated.",
        }),
        headers,
      };
    } else {
      return {
        statusCode: 200,
        body: JSON.stringify({
          message:
            "Method not allowed(only allowed type=updatePassword/updateProfile)",
        }),
        headers: headers,
      };
    }
  }

  if (event.httpMethod == "POST" && event.queryStringParameters.type == "woocommerce") {
    let body = JSON.parse(event.body);
    console.log(decoded.id);
    console.log(body);
    const {consumerKey,consumerSecret,url}=body;
    var wooObj={
      consumerKey:consumerKey,
      consumerSecret:consumerSecret,
      url:url
    }
    
    try {
      await User.findOneAndUpdate({ _id: decoded.id }, { $set: wooObj });
    } catch (error) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "update failed",
        }),
        headers,
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "You have successfully updated.",
      }),
      headers,
    };
  }

  if (event.httpMethod == "POST" && event.queryStringParameters.type == "shopify") {
    let body = JSON.parse(event.body);
    console.log(decoded.id);
    console.log(body);
    const {shopifyUrl,shopifyApiToken,shopifyApiKey}=body;
    var shopifyObj={
      shopifyUrl:shopifyUrl,
      shopifyApiToken:shopifyApiToken,
      shopifyApiKey:shopifyApiKey
    }
    
    try {
      await User.findOneAndUpdate({ _id: decoded.id }, { $set: shopifyObj });
    } catch (error) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "update failed",
        }),
        headers,
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "You have successfully updated.",
      }),
      headers,
    };
  }
  if (event.httpMethod == "GET") {
    
    try {
      const user=await User.findOne({ _id: decoded.id });
      
    return {
      statusCode: 200,
      body: JSON.stringify({
        user,
      }),
      headers: headers,
    };
    } catch (error) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "request failed",
        }),
        headers: headers,
      };
    }

  }
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Method not allowed",
    }),
    headers: headers,
  };
};
