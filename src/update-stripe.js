require("dotenv").config();
var jwt = require("jsonwebtoken");
var jcsDataOp = require("/dao/jcs-data-operation");
//import Stripe from "stripe";
var User = require("./auth/auth.model");

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

    const logedUser = await User.findOne({ _id: decoded.id });
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
const stripe = new Stripe(
  "sk_test_51LKNLnBZCQ2Q2AwNpNjawBO1Io9O0y9MxxoGL6OZ5mqxhPKA1NsYhjhgzCY8HOyDZoRzWNH1gnJ8furlLKS6omkS008dUaWbyW"
);

try {
    const { customer_id, name, email, payment_method, old_payment_method } =
    body;
    console.log(email);

    const customer = await stripe.customers.update(customer_id, {
      email: email,
      name: name,
    });
    const paymentMethod1 = await stripe.paymentMethods.detach(
      old_payment_method
    );
    const paymentMethod = await stripe.paymentMethods.attach(payment_method, {
      customer: customer_id,
    });
    console.log(paymentMethod);

    return {
        statusCode: 200,
        body: JSON.stringify(paymentMethod),
        headers,
      };
  } catch (err) {
    return {
        statusCode: 200,
        body: JSON.stringify( {message: err.message }),
        headers,
      };
  }

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