const mongoose = require("mongoose");

const User = mongoose.model(
    "User",
    new mongoose.Schema({
        _id: String,
        email: String,
        name: String,
        password: String,
        consumerSecret:String,
        consumerKey:String,
        companyName:String,
        ecomService:String,
        shopifyUrl:String,
        shopifyApiToken:String,
        shopifyApiKey:String,
        url:String,
        host:String,
        isPayment:Boolean,
        package:String,
        customer_id:String,
        subscription_id:String,
        subscription_email:String,
        payment_method:String,


    })
);

module.exports = User;