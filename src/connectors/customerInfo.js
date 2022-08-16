require('dotenv').config();
const { JCS_MONGO_INST } = process.env


var mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI,{ useNewUrlParser: true,
  useUnifiedTopology: true, useFindAndModify: false});
var Schema = mongoose.Schema;

var customerDataSchema = new Schema(
  {
    orders:{type:[{}],required:false},
    email:{type:String,required:false,unique: true},
    mobile:{type:String,required:false},
  }
  , { collection: 'customers' })

var CustomerInfo = mongoose.model('customerInfo', customerDataSchema);

module.exports = CustomerInfo;
