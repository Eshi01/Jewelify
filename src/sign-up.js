
const mongoose = require('mongoose');
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const User = require("./auth/auth.model");
var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");
var axios = require("axios");

exports.handler = async (event, context) => {

  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Origin,Content-Type, Authorization, X-Requested-With",
    "Access-Control-Allow-Methods": "GET, POST,PUT,DELETE, OPTIONS",
  };
  
  await mongoose
    .connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false
    })
    .then(() => {
      console.log("Successfully connected to MongoDB.");
    })
    .catch(err => {
      console.error("Connection error", err);
      process.exit();
    });

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Method not allowed'
      }),
      headers,
    };
  }

  const body = JSON.parse(event.body);


  if (!validateEmail(body.email)) {
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Invalid Email Pattern"
      }),
      headers,
    }
  };


  try {
    const existingUser = await User.findOne({
      email: body.email
    })

    if (existingUser) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "Email is already in use!"
        }),
        headers,
      }
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message
      }),
      headers,
    }
  }

  try {
    const user = await new User({
      _id:  body.email,
      email: body.email,
      password: bcrypt.hashSync(body.password, 8)
    });
    await user.save();
    const params = {
      service_id: "service_td1ge5n",
      template_id: "template_z2tfsco",
      accessToken: "-L4-14eRhemMRgdavcaLG",
      user_id: "AfVOYQ8ZwAoTPryZa",
      template_params: {
        email: body.email,
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
    var token = jwt.sign({ id: user.id }, "M7HTLPdYICMz8sXCJz_leZmo", {});
    const responseUser = {
      email: user.email,
      accessToken: token
    }
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'You have successfully created a new account!', user: responseUser
      }),
      headers,
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message
      }),
      headers,
    }
  }
}

//email pattern validation
function validateEmail(mail) {
  var check =  /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(mail);
  return check;
}
